import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { AdminRole } from "@/lib/constants";
import { signInAdmin } from "@/server/actions/admin-auth-actions";
import {
  addOrderNote,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/server/actions/admin-order-actions";
import { listAdminOrders } from "@/server/admin/orders";

import { createAdmin, createCategory, createProduct, PASSWORD } from "./factories";

/**
 * Order operations: the transition map, the stock consequences of cancelling,
 * and the timeline an operator relies on when a customer calls.
 */

const ORDER_NUMBER = "QC-2026-000042";

let productId: string;

async function signedInAs(role: AdminRole) {
  const admin = await createAdmin(role);
  expect((await signInAdmin({ email: admin.email, password: PASSWORD })).ok).toBe(true);
  return admin;
}

async function createOrder(status = "PENDING", quantity = 2) {
  return db.order.create({
    data: {
      orderNumber: ORDER_NUMBER,
      customerName: "Ayesha Khan",
      customerEmail: "shopper@qalb.test",
      customerPhone: "+92 300 1234567",
      status,
      subtotal: 2_450_000 * quantity,
      total: 2_450_000 * quantity,
      shippingName: "Ayesha Khan",
      shippingLine1: "12 Zamzama Boulevard",
      shippingCity: "Karachi",
      items: {
        create: {
          productId,
          name: "Tank Must",
          brand: "Cartier",
          sku: "QC-A",
          quantity,
          unitPrice: 2_450_000,
          lineTotal: 2_450_000 * quantity,
        },
      },
    },
  });
}

beforeEach(async () => {
  const category = await createCategory();
  productId = (await createProduct(category.id, { sku: "QC-A", stock: 1 })).id;
});

describe("updateOrderStatus", () => {
  it("moves an order along an allowed transition and records the event", async () => {
    const admin = await signedInAs("ORDER_MANAGER");
    await createOrder("PENDING");

    const result = await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "CONFIRMED" });

    expect(result.ok).toBe(true);
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: ORDER_NUMBER },
      include: { events: true },
    });
    expect(order.status).toBe("CONFIRMED");
    expect(order.events).toHaveLength(1);
    expect(order.events[0].actor).toBe(admin.email);
  });

  it("refuses a transition the workflow does not allow", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("DELIVERED");

    const result = await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "PENDING" });

    expect(result.ok).toBe(false);
    expect(
      (await db.order.findUniqueOrThrow({ where: { orderNumber: ORDER_NUMBER } })).status,
    ).toBe("DELIVERED");
  });

  it("says nothing changed when the order is already in that state", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("CONFIRMED");

    const result = await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "CONFIRMED" });

    expect(result.ok).toBe(false);
    expect(await db.orderEvent.count()).toBe(0);
  });

  it("returns stock to the shelf when an order is cancelled", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("PENDING", 2);

    await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "CANCELLED" });

    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(3);
  });

  it("treats delivery of a cash-on-delivery order as payment", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("SHIPPED");

    await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "DELIVERED" });

    expect(
      (await db.order.findUniqueOrThrow({ where: { orderNumber: ORDER_NUMBER } })).paymentStatus,
    ).toBe("PAID");
  });

  it("keeps a note against the status change", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("PENDING");

    await updateOrderStatus({
      orderNumber: ORDER_NUMBER,
      status: "CONFIRMED",
      note: "Customer confirmed the address by phone.",
    });

    const [event] = await db.orderEvent.findMany();
    expect(event.message).toContain("Customer confirmed the address by phone.");
  });

  it("stops an editor touching orders at all", async () => {
    await signedInAs("EDITOR");
    await createOrder("PENDING");

    const result = await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "CONFIRMED" });

    expect(result.ok).toBe(false);
    expect(
      (await db.order.findUniqueOrThrow({ where: { orderNumber: ORDER_NUMBER } })).status,
    ).toBe("PENDING");
  });

  it("stops a signed-out caller touching orders", async () => {
    await createOrder("PENDING");

    const result = await updateOrderStatus({ orderNumber: ORDER_NUMBER, status: "CONFIRMED" });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("sign in");
  });
});

describe("updatePaymentStatus", () => {
  it("records the payment, its reference and a timeline entry", async () => {
    await signedInAs("ADMIN");
    await createOrder("CONFIRMED");

    const result = await updatePaymentStatus({
      orderNumber: ORDER_NUMBER,
      paymentStatus: "PAID",
      reference: "BANK-9931",
    });

    expect(result.ok).toBe(true);
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: ORDER_NUMBER },
      include: { events: true },
    });
    expect(order.paymentStatus).toBe("PAID");
    expect(order.paymentRef).toBe("BANK-9931");
    expect(order.events[0].message).toContain("BANK-9931");
  });

  it("rejects a payment state that is not in the vocabulary", async () => {
    await signedInAs("ADMIN");
    await createOrder("CONFIRMED");

    const result = await updatePaymentStatus({
      orderNumber: ORDER_NUMBER,
      paymentStatus: "SORT-OF-PAID",
    });

    expect(result.ok).toBe(false);
  });
});

describe("addOrderNote", () => {
  it("appends an internal note without changing the order", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("CONFIRMED");

    const result = await addOrderNote({
      orderNumber: ORDER_NUMBER,
      message: "Courier collected at 4pm.",
    });

    expect(result.ok).toBe(true);
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: ORDER_NUMBER },
      include: { events: true },
    });
    expect(order.status).toBe("CONFIRMED");
    expect(order.events[0].type).toBe("note");
  });

  it("refuses an empty note", async () => {
    await signedInAs("ORDER_MANAGER");
    await createOrder("CONFIRMED");

    expect((await addOrderNote({ orderNumber: ORDER_NUMBER, message: " " })).ok).toBe(false);
  });
});

describe("listAdminOrders", () => {
  it("filters by status and searches by order number, email and name", async () => {
    await createOrder("PENDING");
    await db.order.create({
      data: {
        orderNumber: "QC-2026-000043",
        customerName: "Bilal Ahmed",
        customerEmail: "bilal@example.com",
        customerPhone: "+92 300 7654321",
        status: "SHIPPED",
        subtotal: 100_000,
        total: 100_000,
        shippingName: "Bilal Ahmed",
        shippingLine1: "4 Mall Road",
        shippingCity: "Lahore",
      },
    });

    await expect(listAdminOrders({ status: "SHIPPED" })).resolves.toMatchObject({ total: 1 });
    await expect(listAdminOrders({ q: "000042" })).resolves.toMatchObject({ total: 1 });
    await expect(listAdminOrders({ q: "bilal@example.com" })).resolves.toMatchObject({ total: 1 });
    await expect(listAdminOrders({ q: "Ayesha" })).resolves.toMatchObject({ total: 1 });
    await expect(listAdminOrders({})).resolves.toMatchObject({ total: 2, revenue: 5_000_000 });
  });
});
