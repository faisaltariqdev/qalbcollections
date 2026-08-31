import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/** Admin order read model: every order, filterable by status and searchable. */

const PER_PAGE = 20;

export interface AdminOrderFilters {
  q?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
}

export async function listAdminOrders(filters: AdminOrderFilters) {
  const where: Prisma.OrderWhereInput = {};

  if (filters.q) {
    const term = filters.q.trim();
    where.OR = [
      { orderNumber: { contains: term } },
      { customerName: { contains: term } },
      { customerEmail: { contains: term } },
      { customerPhone: { contains: term } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

  const page = Math.max(1, filters.page ?? 1);

  const [orders, total, totals] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        currency: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.order.count({ where }),
    db.order.aggregate({ where, _sum: { total: true } }),
  ]);

  return {
    orders,
    total,
    revenue: totals._sum.total ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

export async function getAdminOrder(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });
}
