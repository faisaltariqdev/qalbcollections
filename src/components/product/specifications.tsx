import { groupBy } from "@/lib/utils";
import type { SpecificationRow } from "@/server/catalog-types";

/**
 * Specification table.
 *
 * Rows come from the category's declared attributes, so a watch shows
 * Movement/Case/Dial and a perfume will show Fragrance Family/Notes without any
 * code change. Empty fields are never rendered — an unknown value is omitted
 * rather than shown as a dash.
 */
export function Specifications({ rows }: { rows: SpecificationRow[] }) {
  if (rows.length === 0) return null;

  const groups = groupBy(rows, (row) => row.group);
  const order = Array.from(new Set(rows.map((row) => row.group)));

  return (
    <div className="grid gap-x-14 gap-y-10 sm:grid-cols-2">
      {order.map((group) => (
        <section key={group}>
          <h3 className="eyebrow border-b border-line pb-3 text-ink">{group}</h3>
          <dl className="mt-1">
            {(groups[group] ?? []).map((row) => (
              <div
                key={row.key}
                className="flex items-baseline justify-between gap-6 border-b border-line-soft py-3.5"
              >
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className="text-right text-sm text-ink" data-numeric>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
