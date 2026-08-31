import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getCurrency, toMajorUnits } from "@/lib/money";
import { getSiteSettings, serialiseSetting, SETTINGS_FIELDS } from "@/lib/settings";

export default async function AdminSettingsPage() {
  await requireAdminPage("settings.write");

  const settings = await getSiteSettings();
  const currency = getCurrency(settings.currency);
  const source = settings as unknown as Record<string, unknown>;

  // Amounts are stored in minor units; the form works in the units a human types.
  const values: Record<string, string> = {};
  for (const field of SETTINGS_FIELDS) {
    const key = field.key as string;
    const raw = source[key];
    values[key] =
      field.type === "money" && typeof raw === "number"
        ? String(toMajorUnits(raw, currency.code))
        : serialiseSetting(raw);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Contact details, delivery charges, tax and feature flags. Everything the storefront states about the business is read from here."
      />
      <SettingsForm values={values} currencySymbol={currency.symbol} />
    </>
  );
}
