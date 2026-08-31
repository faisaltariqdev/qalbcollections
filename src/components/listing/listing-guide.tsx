const STEPS = [
  {
    n: "01",
    title: "Read the poster",
    body: "Every card is the atelier photograph of the watch you receive — logo, dial and box included.",
  },
  {
    n: "02",
    title: "Hover for detail",
    body: "Move over a card to see the case-back, profile and packing. On a phone, open the piece.",
  },
  {
    n: "03",
    title: "Narrow the edit",
    body: "Filter by brand, movement, size or price. Sort newest, price or most chosen.",
  },
  {
    n: "04",
    title: "Open and decide",
    body: "The product page lists specifications, warranty and delivery. Add to bag, or ask on WhatsApp.",
  },
] as const;

/**
 * Visible, crawlable explanation of how the catalogue listing works.
 * Paired with HowTo JSON-LD from the listing shell.
 */
export function ListingGuide() {
  return (
    <section
      aria-labelledby="listing-guide-heading"
      className="border-y border-ink/10 bg-nav"
    >
      <div className="shell-x mx-auto max-w-[88rem] py-10 sm:py-12">
        <p className="eyebrow text-burgundy">How this listing works</p>
        <h2
          id="listing-guide-heading"
          className="mt-3 max-w-xl font-display text-[clamp(1.5rem,3vw,2.15rem)] font-medium leading-[1.1] text-ink"
        >
          Four steps from the grid to your wrist.
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.n} className="relative">
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[2.75rem] top-3 hidden h-px w-[calc(100%-1.5rem)] bg-champ/35 lg:block"
                />
              ) : null}
              <span className="font-display text-xl text-champ" data-numeric>
                {step.n}
              </span>
              <h3 className="mt-2 font-display text-xl font-medium text-ink">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export const LISTING_GUIDE_STEPS = STEPS;
