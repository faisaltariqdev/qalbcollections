import { formatMoney } from "@/lib/money";

/**
 * Revenue over time, drawn as inline SVG.
 *
 * A charting library would add far more JavaScript than this needs: the series
 * is already on the server, and bars are enough to read a trend.
 */
export function MiniChart({
  series,
  currency,
}: {
  series: { date: string; revenue: number; orders: number }[];
  currency: string;
}) {
  if (series.length === 0) {
    return <p className="text-sm text-muted">No activity in this period.</p>;
  }

  const peak = Math.max(...series.map((point) => point.revenue), 1);
  const labelEvery = Math.ceil(series.length / 6);

  return (
    <div>
      <div className="flex h-40 items-end gap-px" role="img" aria-label="Revenue by day">
        {series.map((point, index) => {
          const height = Math.max(2, Math.round((point.revenue / peak) * 100));
          return (
            <div
              key={point.date}
              className="group relative flex-1"
              style={{ height: `${height}%` }}
              title={`${point.date}: ${formatMoney(point.revenue, currency)} · ${point.orders} ${
                point.orders === 1 ? "order" : "orders"
              }`}
            >
              <div
                className={
                  point.revenue > 0
                    ? "size-full bg-ink/80 transition-colors group-hover:bg-qalb"
                    : "size-full bg-line"
                }
              />
              {index % labelEvery === 0 ? (
                <span className="pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap text-[0.5625rem] text-faint">
                  {point.date.slice(5)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex items-baseline justify-between text-xs text-muted">
        <span>Peak day {formatMoney(peak, currency)}</span>
        <span data-numeric>
          {series.reduce((sum, point) => sum + point.orders, 0)} orders in period
        </span>
      </div>
    </div>
  );
}
