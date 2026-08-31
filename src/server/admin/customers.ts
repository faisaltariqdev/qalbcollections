import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Admin customer read model.
 *
 * Lifetime spend counts only orders that were actually paid for, so the number
 * is a real figure rather than the sum of everything ever attempted.
 */

const PER_PAGE = 20;
const EARNING_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export interface AdminCustomerFilters {
  q?: string;
  state?: "active" | "inactive" | "subscribed";
  page?: number;
}

export async function listAdminCustomers(filters: AdminCustomerFilters) {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.q) {
    const term = filters.q.trim();
    where.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
      { phone: { contains: term } },
    ];
  }
  if (filters.state === "active") where.active = true;
  if (filters.state === "inactive") where.active = false;
  if (filters.state === "subscribed") where.marketingOptIn = true;

  const page = Math.max(1, filters.page ?? 1);

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        marketingOptIn: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { in: EARNING_STATUSES } },
          select: { total: true, currency: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.customer.count({ where }),
  ]);

  return {
    customers: customers.map(({ orders, ...customer }) => ({
      ...customer,
      lifetimeSpend: orders.reduce((sum, order) => sum + order.total, 0),
      currency: orders[0]?.currency ?? "PKR",
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

export async function getAdminCustomer(id: string) {
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      addresses: true,
      wishlists: {
        select: {
          items: {
            select: {
              product: { select: { id: true, name: true, slug: true, brand: true } },
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  const earning = customer.orders.filter((order) => EARNING_STATUSES.includes(order.status));
  const { wishlists, ...rest } = customer;

  return {
    ...rest,
    saved: wishlists.flatMap((wishlist) => wishlist.items.map((item) => item.product)),
    lifetimeSpend: earning.reduce((sum, order) => sum + order.total, 0),
    currency: customer.orders[0]?.currency ?? "PKR",
  };
}
