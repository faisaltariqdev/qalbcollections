import type { SpecificationRow } from "@/server/catalog-types";

const PREFERRED_KEYS = [
  "movement",
  "case-size",
  "case-material",
  "water-resistance",
  "strap-material",
  "warranty",
  "crystal",
  "dial-colour",
];

/**
 * Four scannable facts beside the price — the questions a careful shopper
 * asks before they scroll to the full specification table.
 */
export function ProductHighlights({ rows }: { rows: SpecificationRow[] }) {
  const picked: SpecificationRow[] = [];
  for (const key of PREFERRED_KEYS) {
    const row = rows.find((item) => item.key === key);
    if (row) picked.push(row);
    if (picked.length === 4) break;
  }

  if (picked.length < 4) {
    for (const row of rows) {
      if (picked.some((item) => item.key === row.key)) continue;
      picked.push(row);
      if (picked.length === 4) break;
    }
  }

  if (picked.length === 0) return null;

  return (
    <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-champ/25 bg-champ/20 sm:grid-cols-4">
      {picked.map((row) => (
        <li key={row.key} className="bg-nav px-3 py-4 sm:px-4">
          <p className="eyebrow text-[0.4375rem] tracking-[0.22em] text-burgundy">{row.label}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink">{row.value}</p>
        </li>
      ))}
    </ul>
  );
}
