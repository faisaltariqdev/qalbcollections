import { CouponManager } from "@/components/admin/coupon-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getCurrency } from "@/lib/money";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminCouponsPage() {
  await requireAdminPage("settings.write");

  const [coupons, settings] = await Promise.all([
    db.coupon.findMany({ orderBy: [{ active: "desc" }, { code: "asc" }] }),
    getSiteSettings(),
  ]);

  const currency = getCurrency(settings.currency);

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can enter at checkout. Use them deliberately — a luxury brand that is always on sale stops being one."
      />
      <CouponManager
        currency={currency.code}
        divisor={10 ** currency.decimals}
        coupons={coupons.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          minSubtotal: coupon.minSubtotal,
          maxRedemptions: coupon.maxRedemptions,
          redemptions: coupon.redemptions,
          active: coupon.active,
          startsAt: coupon.startsAt?.toISOString() ?? null,
          endsAt: coupon.endsAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
