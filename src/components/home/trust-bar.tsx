import { Award, Droplets, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "6 MONTH WARRANTY",
    body: "Machine warranty on every timepiece",
  },
  {
    icon: Droplets,
    title: "WATER RESISTANT",
    body: "Specified resistance on every listing",
  },
  {
    icon: Truck,
    title: "NATIONWIDE DELIVERY",
    body: "Packed and sent across Pakistan",
  },
  {
    icon: Award,
    title: "AUTHENTIC PIECES",
    body: "Photographed as the stock you receive",
  },
];

/**
 * Trust bar matching the poster icon language.
 */
export function TrustBar() {
  return (
    <section className="border-t border-champ/20 bg-void">
      <div className="shell-x mx-auto grid max-w-[1320px] gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <item.icon className="mt-0.5 size-5 shrink-0 text-champ" strokeWidth={1.5} />
            <div>
              <p className="eyebrow text-[0.5625rem] tracking-[0.2em] text-champ">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-warm-white/60">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
