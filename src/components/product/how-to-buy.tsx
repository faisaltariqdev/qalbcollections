const STEPS = [
  {
    n: "01",
    title: "Study the photographs",
    body: "The images on this page are of the watch you receive — dial, case-back, bracelet and box. Magnify or open full screen.",
  },
  {
    n: "02",
    title: "Read the specifications",
    body: "Movement, case size, water resistance and warranty sit in plain language. Nothing is implied that is not listed.",
  },
  {
    n: "03",
    title: "Add to bag, or ask",
    body: "Place the order here, or message us on WhatsApp with the reference number. Cash on delivery is available.",
  },
  {
    n: "04",
    title: "We pack and send",
    body: "Boxed, tracked, and delivered across Pakistan. Unworn returns are accepted within the stated window.",
  },
] as const;

/**
 * Visible buying path — also emitted as HowTo structured data from the PDP.
 */
export function HowToBuy() {
  return (
    <section id="how-to-buy" className="scroll-mt-36 border-y border-champ/20 bg-void">
      <div className="shell-x mx-auto max-w-[88rem] py-14 sm:py-16">
        <p className="eyebrow text-champ">How to buy this piece</p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.75rem,4vw,2.6rem)] font-normal leading-[1.08] text-warm-white">
          Four steps. Nothing hidden.
        </h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.n} className="relative">
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-12 top-4 hidden h-px w-[calc(100%-1rem)] bg-champ/30 lg:block"
                />
              ) : null}
              <span className="font-display text-[1.75rem] leading-none text-champ" data-numeric>
                {step.n}
              </span>
              <h3 className="mt-4 font-display text-[1.35rem] font-normal leading-snug text-warm-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export const HOW_TO_BUY_STEPS = STEPS;
