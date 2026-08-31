import { z } from "zod";

/**
 * Domain vocabularies. These replace native database enums so the schema stays
 * portable between SQLite and PostgreSQL, while Zod keeps every write validated
 * at the boundary.
 */

export const CATEGORY_STATUSES = ["ACTIVE", "COMING_SOON", "HIDDEN"] as const;
export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "REFUNDED", "FAILED"] as const;
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "ORDER_MANAGER"] as const;
export const ATTRIBUTE_TYPES = ["TEXT", "NUMBER", "ENUM", "BOOLEAN"] as const;
export const TAG_KINDS = ["occasion", "style", "audience"] as const;
export const CONTENT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const COUPON_TYPES = ["PERCENT", "FIXED"] as const;

export const categoryStatusSchema = z.enum(CATEGORY_STATUSES);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const adminRoleSchema = z.enum(ADMIN_ROLES);
export const attributeTypeSchema = z.enum(ATTRIBUTE_TYPES);
export const tagKindSchema = z.enum(TAG_KINDS);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const couponTypeSchema = z.enum(COUPON_TYPES);

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
export type TagKind = (typeof TAG_KINDS)[number];

/** Order statuses an order may move to next. Prevents nonsensical transitions. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  ORDER_MANAGER: "Order Manager",
};

/** Cookie names kept in one place so auth, cart and wishlist never drift. */
export const COOKIES = {
  adminSession: "qalb_admin_session",
  customerSession: "qalb_session",
  cart: "qalb_cart",
} as const;

export const SESSION_TTL_DAYS = 30;

export const PRODUCTS_PER_PAGE = 12;
export const MAX_COMPARE_ITEMS = 4;
export const MAX_RECENTLY_VIEWED = 8;

/** localStorage keys for guest-only state. */
export const STORAGE_KEYS = {
  wishlist: "qalb.wishlist.v1",
  compare: "qalb.compare.v1",
  recentlyViewed: "qalb.recently-viewed.v1",
} as const;
