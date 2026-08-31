import "server-only";

import { db } from "@/lib/db";

/**
 * Dashboard read model.
 *
 * Every figure comes from the orders table rather than a cached counter, so the
 * numbers cannot drift. Cancelled orders are excluded from revenue but still
 * counted as orders — an operator needs to see both.
 */

export const DASHBOARD_RANGES = {
  today: { label: "Today", days: 1 },
  "7d": { label: "7 days", days: 7 },
  "30d": { label: "30 days", days: 30 },
  "90d": { label: "90 days", days: 90 },
} as const;

export type DashboardRange = keyof typeof DASHBOARD_RANGES;

export function parseRange(value: string | string[] | undefined): DashboardRange {
  const first = Array.isArray(value) ? value[0] : value;
  return first && first in DASHBOARD_RANGES ? (first as DashboardRange) : "30d";
}

function startOf(range: DashboardRange) {
  const { days } = DASHBOARD_RANGES[range];
  const start = new Date();
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

const EXCLUDED_FROM_REVENUE = ["CANCELLED", "RETURNED"];

export interface DashboardData {
  range: DashboardRange;
  from: Date;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  currency: string;
  newCustomers: number;
  pendingOrders: number;
  totalProducts: number;
  publishedProducts: number;
  lowStock: { id: string; name: string; sku: string; stock: number; lowStockThreshold: number }[];
  outOfStock: number;
  series: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; brand: string; quantity: number; revenue: number }[];
  categoryPerformance: { name: string; revenue: number; quantity: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    createdAt: Date;
  }[];
  unreadMessages: number;
}

export async function getDashboard(range: DashboardRange): Promise<DashboardData> {
  const from = startOf(range);

  const [orders, customerCount, pendingOrders, productStats, lowStock, outOfStock, unreadMessages] =
    await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: from } },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          currency: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          items: {
            select: {
              name: true,
              brand: true,
              quantity: true,
              lineTotal: true,
              product: { select: { category: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.customer.count({ where: { createdAt: { gte: from } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.product.groupBy({ by: ["status"], _count: { _all: true } }),
      db.product.findMany({
        where: { status: "ACTIVE", stock: { gt: 0 }, comingSoon: false },
        select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true },
        orderBy: { stock: "asc" },
        take: 20,
      }),
      db.product.count({ where: { status: "ACTIVE", stock: 0, comingSoon: false } }),
      db.contactMessage.count({ where: { status: "NEW" } }),
    ]);

  const counted = orders.filter((order) => !EXCLUDED_FROM_REVENUE.includes(order.status));
  const revenue = counted.reduce((sum, order) => sum + order.total, 0);

  // One bucket per day in the range, including days with no orders, so the
  // chart shows the shape of the period rather than only its activity.
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const cursor = new Date(from);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (cursor <= today) {
    buckets.set(cursor.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const order of counted) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(day);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  }

  const byProduct = new Map<string, { name: string; brand: string; quantity: number; revenue: number }>();
  const byCategory = new Map<string, { name: string; revenue: number; quantity: number }>();

  for (const order of counted) {
    for (const item of order.items) {
      const productKey = `${item.brand}::${item.name}`;
      const product = byProduct.get(productKey) ?? {
        name: item.name,
        brand: item.brand,
        quantity: 0,
        revenue: 0,
      };
      product.quantity += item.quantity;
      product.revenue += item.lineTotal;
      byProduct.set(productKey, product);

      const categoryName = item.product?.category.name ?? "Uncategorised";
      const category = byCategory.get(categoryName) ?? {
        name: categoryName,
        revenue: 0,
        quantity: 0,
      };
      category.revenue += item.lineTotal;
      category.quantity += item.quantity;
      byCategory.set(categoryName, category);
    }
  }

  const totalProducts = productStats.reduce((sum, row) => sum + row._count._all, 0);

  return {
    range,
    from,
    revenue,
    orderCount: orders.length,
    averageOrderValue: counted.length > 0 ? Math.round(revenue / counted.length) : 0,
    currency: orders[0]?.currency ?? "PKR",
    newCustomers: customerCount,
    pendingOrders,
    totalProducts,
    publishedProducts: productStats.find((row) => row.status === "ACTIVE")?._count._all ?? 0,
    lowStock: lowStock.filter((product) => product.stock <= product.lowStockThreshold).slice(0, 6),
    outOfStock,
    series: [...buckets.entries()].map(([date, values]) => ({ date, ...values })),
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    categoryPerformance: [...byCategory.values()].sort((a, b) => b.revenue - a.revenue),
    // Line items are only needed for the aggregates above, not for the table.
    recentOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: order.total,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    })),
    unreadMessages,
  };
}
