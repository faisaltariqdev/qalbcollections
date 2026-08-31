/**
 * Seed content for Qalb Collections.
 *
 * Product photography and the brand mark are the client's own supplied assets.
 * Prices, stock levels, specifications and editorial copy in this file are
 * demonstration values so the storefront can be evaluated end to end — every
 * one of them is editable in the admin. Demo customers and orders are prefixed
 * `[DEMO]` so they are obvious in the dashboard.
 */

export interface SeedAttributeDefinition {
  key: string;
  label: string;
  unit?: string;
  type: "TEXT" | "NUMBER" | "ENUM" | "BOOLEAN";
  group: string;
  filterable?: boolean;
  comparable?: boolean;
  showInSpecs?: boolean;
}

export interface SeedProduct {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  shortDescription: string;
  description: string;
  story: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  bestsellerRank?: number;
  comingSoon?: boolean;
  limited?: boolean;
  exclusive?: boolean;
  sortOrder: number;
  images: { url: string; alt: string; width: number; height: number }[];
  attributes: Record<string, string>;
  collections: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants?: { name: string; value: string; sku: string; stock: number }[];
  faqs?: { question: string; answer: string }[];
}

// ---------------------------------------------------------------------------
// Attribute definitions — the category engine
// ---------------------------------------------------------------------------

export const WATCH_ATTRIBUTES: SeedAttributeDefinition[] = [
  { key: "movement", label: "Movement", type: "ENUM", group: "Movement", filterable: true, comparable: true },
  { key: "power-reserve", label: "Power reserve", type: "TEXT", group: "Movement" },
  { key: "case-material", label: "Case material", type: "ENUM", group: "Case", filterable: true },
  { key: "case-shape", label: "Case shape", type: "ENUM", group: "Case", filterable: true },
  { key: "case-size", label: "Case size", unit: "mm", type: "NUMBER", group: "Case", filterable: true, comparable: true },
  { key: "crystal", label: "Crystal", type: "ENUM", group: "Case", filterable: true },
  { key: "dial-colour", label: "Dial colour", type: "ENUM", group: "Dial", filterable: true, comparable: true },
  { key: "dial-detail", label: "Dial detail", type: "TEXT", group: "Dial" },
  { key: "strap-material", label: "Strap", type: "ENUM", group: "Strap", filterable: true, comparable: true },
  { key: "strap-colour", label: "Strap colour", type: "ENUM", group: "Strap", filterable: true },
  { key: "water-resistance", label: "Water resistance", unit: "m", type: "NUMBER", group: "Function", filterable: true, comparable: true },
  { key: "functions", label: "Functions", type: "TEXT", group: "Function" },
  { key: "gender", label: "Worn by", type: "ENUM", group: "Fit", filterable: true },
  { key: "warranty", label: "Warranty", type: "TEXT", group: "Ownership" },
];

/**
 * Perfume attributes exist before the category launches. This is the proof that
 * a new product type needs data entry, not a rewrite: the specification table,
 * filters and comparison all read from these declarations.
 */
export const PERFUME_ATTRIBUTES: SeedAttributeDefinition[] = [
  { key: "fragrance-family", label: "Fragrance family", type: "ENUM", group: "Composition", filterable: true, comparable: true },
  { key: "concentration", label: "Concentration", type: "ENUM", group: "Composition", filterable: true, comparable: true },
  { key: "top-notes", label: "Top notes", type: "TEXT", group: "Notes" },
  { key: "heart-notes", label: "Heart notes", type: "TEXT", group: "Notes" },
  { key: "base-notes", label: "Base notes", type: "TEXT", group: "Notes" },
  { key: "volume", label: "Volume", unit: "ml", type: "NUMBER", group: "Format", filterable: true, comparable: true },
  { key: "longevity", label: "Longevity", type: "TEXT", group: "Wear" },
];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const WATCH_PRODUCTS: SeedProduct[] = [
  {
    name: "Tank Rectangular — Gold-Tone, Black Dial",
    slug: "cartier-tank-rectangular-gold-tone-black-dial",
    sku: "QC-CAR-TNK-01",
    brand: "Cartier",
    shortDescription:
      "A rectangular gold-tone case over a lacquer-black dial, finished on grained black calf leather.",
    description:
      "The Tank silhouette is the reason rectangular watches still look modern a century after they were drawn. This example pairs a warm gold-tone case with a deep black dial and slim gold batons — no seconds hand, no date window, nothing competing for attention. It sits flat under a cuff and reads instantly from across a table.\n\nSupplied on grained black calf leather with a matching gold-tone buckle.",
    story:
      "Some watches announce. This one confirms.\n\nThe rectangular case is the hardest shape to get right — too narrow and it reads feminine, too wide and it reads costume. The proportion here is the one that works: long enough to follow the wrist, slim enough to disappear under a shirt cuff, with brancards that frame the dial rather than decorate it.\n\nThe dial is doing something quietly clever. Black lacquer removes every reference point except the hands, so your eye goes straight to the time and then to the person wearing it. Gold against black is the oldest legible pairing in watchmaking, and it is still the one that photographs best under warm light.\n\n> Wear it with a navy suit and a blue tie and it will look like it was made for the outfit. It was not. That is the point.\n\nThis is the watch for the signature, the dinner, the day that matters — and it is equally at home with a white shirt and no jacket at all.",
    price: 1850000,
    compareAtPrice: 2200000,
    stock: 2,
    lowStockThreshold: 2,
    featured: true,
    bestseller: true,
    bestsellerRank: 2,
    exclusive: true,
    sortOrder: 1,
    images: [
      {
        url: "/media/lookbook/cartier-tank-hero.jpg",
        alt: "Cartier Tank rectangular watch with gold-tone case and black dial on a cream stone plinth",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/cartier-tank-detail.jpg",
        alt: "Cartier Tank detail views — crown, case-back, box and colour variants",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "Gold-tone stainless steel",
      "case-shape": "Rectangular",
      "case-size": "25",
      crystal: "Mineral glass",
      "dial-colour": "Black",
      "dial-detail": "Gold-tone baton hands, no seconds hand, no date",
      "strap-material": "Grained calf leather",
      "strap-colour": "Black",
      "water-resistance": "30",
      functions: "Hours, minutes",
      gender: "Unisex",
      warranty: "12 months, Qalb Collections",
    },
    collections: ["the-dress-code", "the-signature-edit"],
    tags: ["formal", "classic", "minimal", "for-him", "for-her", "anniversary", "wedding", "eid"],
    seoTitle: "Cartier Tank Rectangular Gold-Tone, Black Dial",
    seoDescription:
      "Rectangular gold-tone Cartier Tank with a lacquer-black dial on grained black calf leather. In stock at Qalb Collections with 12-month warranty.",
    faqs: [
      {
        question: "Will this fit a smaller wrist?",
        answer:
          "Yes. The rectangular case is 25 mm across and sits close to the wrist, so it works from roughly 15 cm upwards. The leather strap can also be shortened by any watchmaker at no cost to the look.",
      },
    ],
  },
  {
    name: "Carrera Twin-Time Automatic — Anthracite Dial",
    slug: "tag-heuer-carrera-twin-time-automatic-anthracite",
    sku: "QC-TAG-CRA-01",
    brand: "TAG Heuer",
    shortDescription:
      "Automatic second-time-zone Carrera with a sunburst anthracite dial on alligator-embossed brown leather.",
    description:
      "A Carrera built for people who keep two clocks in their head. The central red-tipped arrow tracks a second time zone against the inner 24-hour scale, while the date sits at six o'clock where it does not interrupt the dial.\n\nThe anthracite dial is sunburst-finished, so it reads near-black indoors and warms to graphite in daylight. Polished applied indices and a fully polished steel case give it more presence than the 41 mm diameter suggests.",
    story:
      "The Carrera was drawn for drivers, which is why it is still one of the most legible watches ever made.\n\nEverything on this dial has a job. The applied indices are faceted so they catch light from any angle. The minute track is fine enough to read at a glance but not so fine that it turns to noise. And the red-tipped arrow — the one part of the dial allowed any colour — points to a second time zone, because the people who bought the original were rarely in one place.\n\nThe automatic movement means it keeps running as long as you do. Wear it four days a week and it will never need setting.\n\n> Sunburst anthracite is the most useful dial colour there is. It behaves like black in a boardroom and like warm grey in daylight.\n\nOn alligator-embossed brown leather it reads as a travel watch. On a steel bracelet it would read as a dress watch. We prefer it exactly as it came.",
    price: 2490000,
    compareAtPrice: 2990000,
    stock: 1,
    lowStockThreshold: 2,
    featured: true,
    bestseller: true,
    bestsellerRank: 1,
    limited: true,
    sortOrder: 0,
    images: [
      {
        url: "/media/lookbook/tag-heuer-carrera-hero.jpg",
        alt: "TAG Heuer Carrera Twin-Time Automatic on a marble pedestal against a burgundy atelier backdrop",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/tag-heuer-carrera-detail.jpg",
        alt: "TAG Heuer Carrera Twin-Time details — presentation box, deployant clasp and strap colours",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Automatic",
      "power-reserve": "Approximately 42 hours",
      "case-material": "Stainless steel",
      "case-shape": "Round",
      "case-size": "41",
      crystal: "Sapphire",
      "dial-colour": "Anthracite",
      "dial-detail": "Sunburst finish, applied polished indices, red-tipped GMT arrow",
      "strap-material": "Alligator-embossed leather",
      "strap-colour": "Brown",
      "water-resistance": "100",
      functions: "Hours, minutes, seconds, date, second time zone",
      gender: "Men",
      warranty: "12 months, Qalb Collections",
    },
    collections: ["the-signature-edit", "the-dress-code"],
    tags: [
      "formal",
      "statement",
      "sport",
      "for-him",
      "birthday",
      "anniversary",
      "graduation",
      "fathers-day",
    ],
    seoTitle: "TAG Heuer Carrera Twin-Time Automatic, Anthracite Dial",
    seoDescription:
      "Automatic TAG Heuer Carrera Twin-Time with a 41 mm steel case, sunburst anthracite dial and second time zone. Boxed, with 12-month warranty.",
    variants: [
      { name: "Strap", value: "Brown alligator-embossed leather", sku: "QC-TAG-CRA-01-BRN", stock: 1 },
    ],
    faqs: [
      {
        question: "How do I set the second time zone?",
        answer:
          "Pull the crown to its first position and turn it to move the red-tipped arrow independently against the inner 24-hour scale. The hour and minute hands are unaffected, so your home time keeps running while you travel.",
      },
      {
        question: "Does an automatic need winding?",
        answer:
          "Only if you leave it off the wrist for more than about two days. Normal daily wear keeps it wound; a few turns of the crown restarts it if it stops.",
      },
    ],
  },
  {
    name: "Quartz Day-Date — Black Finish, Black Dial",
    slug: "citizen-quartz-day-date-black-finish",
    sku: "QC-CIT-QDD-01",
    brand: "Citizen",
    shortDescription:
      "Blacked-out steel bracelet watch with a day-date window, luminous batons and crystal-set hour markers.",
    description:
      "A full black finish over steel, with a matching bracelet and a black dial that keeps the hardware invisible until the light finds it. Luminous applied batons handle legibility, crystal accents at the quarters catch the light, and an orange seconds hand is the only break in the monochrome.\n\nDay and date sit together at three o'clock. Supplied in its Citizen presentation box.",
    story:
      "Black-on-black is the easiest way to look expensive and the easiest way to look cheap. The difference is finish.\n\nThis one gets it right because the case is genuinely polished under the coating — light travels along the bezel and down the bracelet links instead of dying on a matte surface. The dial is a shade warmer than the case, which is why the watch reads as one object rather than a black disc inside a black ring.\n\nThe orange seconds hand is the detail people notice second. It is the only warm colour on the watch, and it moves, so your eye keeps returning to it.\n\n> A day-date complication is the most useful thing you can put on a dial. It is also the first thing you stop noticing — which is exactly what a good complication should do.\n\nQuartz, so it is accurate to seconds a month and needs nothing from you but a battery every few years.",
    price: 1250000,
    stock: 6,
    newArrival: true,
    bestseller: true,
    bestsellerRank: 3,
    sortOrder: 2,
    images: [
      {
        url: "/media/lookbook/citizen-black-hero.jpg",
        alt: "Citizen quartz day-date watch with a black finish case and bracelet on a cream stone pedestal",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/citizen-black-detail.jpg",
        alt: "Citizen black day-date details — dial, case and crown, stainless back and presentation boxes",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "Black-finished stainless steel",
      "case-shape": "Round",
      "case-size": "40",
      crystal: "Mineral glass",
      "dial-colour": "Black",
      "dial-detail": "Luminous applied batons, crystal-set quarter markers, orange seconds hand",
      "strap-material": "Steel bracelet",
      "strap-colour": "Black",
      "water-resistance": "30",
      functions: "Hours, minutes, seconds, day, date",
      gender: "Men",
      warranty: "12 months, Qalb Collections",
    },
    collections: ["everyday-essentials"],
    tags: ["everyday", "statement", "for-him", "birthday", "graduation", "eid"],
    seoTitle: "Citizen Quartz Day-Date, Black Finish",
    seoDescription:
      "Blacked-out Citizen quartz day-date on a matching steel bracelet, with luminous batons and crystal hour accents. Boxed, 12-month warranty.",
  },
  {
    name: "Quartz Day-Date — Steel, Silver-White Dial",
    slug: "citizen-quartz-day-date-steel-silver-white",
    sku: "QC-CIT-QDD-02",
    brand: "Citizen",
    shortDescription:
      "Brushed and polished steel bracelet watch with Roman numerals, crystal accents and a day-date window.",
    description:
      "A classical layout done properly: Roman numerals at the quarters, crystal-set markers between them, and a silver-white dial with a concentric inner track that adds depth without clutter.\n\nThe 38 mm steel case alternates brushed and polished surfaces, and the three-link bracelet does the same, so the watch reads bright without looking plated. Day and date at three o'clock.",
    story:
      "This is the watch you buy when you want one watch.\n\nSilver dial, steel bracelet, Roman numerals — the combination has survived every trend since the 1950s because it does not belong to any of them. It works with a shalwar kameez, a suit, or a t-shirt, and it is equally correct on a man's or a woman's wrist at 38 mm.\n\nLook closely and there is more going on than the first glance suggests: the dial has a stepped inner track, the numerals are printed rather than applied so the surface stays flat and bright, and the crystal accents sit exactly where the light lands when your arm is at rest.\n\n> Thirty-eight millimetres is the diameter that stopped being a compromise and became the answer.\n\nQuartz movement, steel bracelet, no fuss. Put it on in the morning and forget about it.",
    price: 1190000,
    compareAtPrice: 1350000,
    stock: 8,
    newArrival: true,
    sortOrder: 3,
    images: [
      {
        url: "/media/lookbook/citizen-steel-hero.jpg",
        alt: "Citizen quartz day-date watch with a silver-white Roman numeral dial on a cream stone pedestal",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/citizen-steel-detail.jpg",
        alt: "Citizen steel day-date details — day-date display, polished bracelet and folding clasp",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "Stainless steel",
      "case-shape": "Round",
      "case-size": "38",
      crystal: "Mineral glass",
      "dial-colour": "Silver-white",
      "dial-detail": "Roman numerals, crystal-set markers, stepped inner track",
      "strap-material": "Steel bracelet",
      "strap-colour": "Silver",
      "water-resistance": "30",
      functions: "Hours, minutes, seconds, day, date",
      gender: "Unisex",
      warranty: "12 months, Qalb Collections",
    },
    collections: ["everyday-essentials", "the-dress-code"],
    tags: ["everyday", "classic", "minimal", "for-him", "for-her", "eid", "mothers-day", "wedding"],
    seoTitle: "Citizen Quartz Day-Date, Steel with Silver-White Dial",
    seoDescription:
      "38 mm Citizen quartz day-date in brushed steel with a Roman numeral silver-white dial. Unisex, boxed, 12-month warranty.",
  },
  {
    name: "Automatic — Square Two-Tone, Silver Dial",
    slug: "citizen-quartz-day-date-two-tone-silver",
    sku: "QC-CIT-QDD-03",
    brand: "Citizen",
    shortDescription:
      "Square cushion-case Citizen automatic in two-tone steel, silver sunray dial and a date at six.",
    description:
      "A square cushion case in silver and gold-tone steel, standing on a cream marble plinth. The silver sunray dial carries baton markers, gold-tone hands and a date at six.\n\nSupplied with its Citizen presentation box and a six-month machine warranty.",
    story:
      "The square Citizen is the piece that was missing from the house edit — two-tone steel, a cushion case, and the same gold-and-burgundy atelier lighting as the rest of the collection.",
    price: 1350000,
    compareAtPrice: 1550000,
    stock: 5,
    newArrival: true,
    featured: true,
    sortOrder: 4,
    images: [
      {
        url: "/media/lookbook/citizen-square-hero.jpg",
        alt: "Citizen square two-tone automatic with a silver dial on a cream marble pedestal",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/citizen-square-detail.jpg",
        alt: "Citizen square two-tone — premium details, case-back, profile and presentation box",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Automatic",
      "case-material": "Two-tone stainless steel",
      "case-shape": "Rectangular",
      "case-size": "40",
      crystal: "Mineral glass",
      "dial-colour": "Silver",
      "dial-detail": "Applied markers, day-date window",
      "strap-material": "Steel bracelet",
      "strap-colour": "Two-tone",
      "water-resistance": "30",
      functions: "Hours, minutes, seconds, day, date",
      gender: "Unisex",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["everyday-essentials", "the-dress-code"],
    tags: ["everyday", "classic", "for-him", "for-her", "eid", "anniversary"],
    seoTitle: "Citizen Automatic Square Two-Tone, Silver Dial",
    seoDescription: "Square cushion-case Citizen automatic in two-tone steel. Water resistant, 6-month machine warranty.",
  },
  {
    name: "Day-Date — Two-Tone, Black Dial",
    slug: "rolex-day-date-two-tone-black",
    sku: "QC-RLX-DD-01",
    brand: "Rolex",
    shortDescription:
      "Two-tone Day-Date with a black diamond-set dial, polished metal bracelet and four colourways in the house edit.",
    description:
      "A black sunburst dial with crystal hour markers and a day window, on a two-tone jubilee-style bracelet. The case is fully polished; the clasp is a secure fold-over.\n\nFour colours are available in this edit. Photographed as the stock you will receive.",
    story:
      "The Day-Date silhouette is the one people still point to when they mean a serious watch. This example keeps the black dial and gold-and-steel bracelet that photographs best under warm light.",
    price: 2890000,
    compareAtPrice: 3290000,
    stock: 2,
    featured: true,
    bestseller: true,
    bestsellerRank: 4,
    exclusive: true,
    sortOrder: 5,
    images: [
      {
        url: "/media/lookbook/rolex-daydate-hero.jpg",
        alt: "Rolex Day-Date two-tone with black dial standing on a stone pedestal",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/rolex-daydate-detail.jpg",
        alt: "Rolex Day-Date details — crystal hour markers, polished bracelet, clasp and four colourways",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Automatic",
      "case-material": "Two-tone stainless steel",
      "case-shape": "Round",
      "case-size": "41",
      crystal: "Sapphire",
      "dial-colour": "Black",
      "dial-detail": "Crystal hour markers, date display",
      "strap-material": "Steel bracelet",
      "strap-colour": "Two-tone",
      "water-resistance": "100",
      functions: "Hours, minutes, seconds, day, date",
      gender: "Men",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["the-signature-edit"],
    tags: ["statement", "formal", "for-him", "anniversary", "eid"],
    seoTitle: "Rolex Day-Date Two-Tone, Black Dial",
    seoDescription: "Two-tone Rolex Day-Date with black diamond-set dial. Water resistant, 6-month machine warranty, delivery across Pakistan.",
  },
  {
    name: "Chronograph — Matte Black",
    slug: "hublot-chronograph-matte-black",
    sku: "QC-HUB-CHR-01",
    brand: "Hublot",
    shortDescription:
      "Matte black chronograph with a skeletonised dial, H-screwed bezel and rubber strap on dark stone.",
    description:
      "A black-on-black chronograph with a skeleton dial and three sub-dials. The bezel is fixed with H-shaped screws; the strap is matching rubber.\n\nWorn for evenings and weekends. Water resistant, with a six-month machine warranty.",
    story:
      "Black ceramic and rubber is the modern sport silhouette. This piece is photographed on slate because that is how it actually wears — dark, quiet, and a little louder up close.",
    price: 2650000,
    stock: 3,
    featured: true,
    newArrival: true,
    limited: true,
    sortOrder: 6,
    images: [
      {
        url: "/media/lookbook/hublot-hero.jpg",
        alt: "Hublot matte black chronograph on dark stone with a burgundy atelier backdrop",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/hublot-detail.jpg",
        alt: "Hublot chronograph detail photography — case, bezel screws and rubber strap",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "Black-finished stainless steel",
      "case-shape": "Round",
      "case-size": "44",
      crystal: "Mineral glass",
      "dial-colour": "Black",
      "dial-detail": "Skeleton chronograph, three sub-dials",
      "strap-material": "Rubber",
      "strap-colour": "Black",
      "water-resistance": "50",
      functions: "Hours, minutes, seconds, chronograph, date",
      gender: "Men",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["the-signature-edit"],
    tags: ["sport", "statement", "for-him", "birthday"],
    seoTitle: "Hublot Chronograph, Matte Black",
    seoDescription: "Matte black Hublot chronograph with rubber strap. Water resistant, 6-month machine warranty.",
  },
  {
    name: "True Ceramic — Black and Silver",
    slug: "rado-true-ceramic-black-silver",
    sku: "QC-RDO-TRU-01",
    brand: "Rado",
    shortDescription:
      "Square ceramic True in black and silver, with diamond markers, a butterfly clasp and a high-tech ceramic case-back.",
    description:
      "A pair of True ceramics — matte black and brushed silver — with diamond hour markers and a slim square case.\n\nHigh-tech ceramic is light on the wrist and hard to scratch. The butterfly clasp is branded; the case-back is engraved Swiss Made.",
    story:
      "Ceramic is the material people reach for when they want a modern square watch that still feels expensive. Black and silver are the two that work with everything.",
    price: 2290000,
    compareAtPrice: 2590000,
    stock: 4,
    featured: true,
    sortOrder: 7,
    images: [
      {
        url: "/media/lookbook/rado-hero.jpg",
        alt: "Rado True ceramic watches in black and silver on a dark marble surface",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/rado-detail.jpg",
        alt: "Rado True details — bracelet clasp, slim side profile and ceramic case-back",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "High-tech ceramic",
      "case-shape": "Rectangular",
      "case-size": "37",
      crystal: "Sapphire",
      "dial-colour": "Black",
      "dial-detail": "Diamond hour markers, date window",
      "strap-material": "Ceramic bracelet",
      "strap-colour": "Black",
      "water-resistance": "50",
      functions: "Hours, minutes, seconds, date",
      gender: "Unisex",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["the-dress-code", "the-signature-edit"],
    tags: ["minimal", "classic", "for-him", "for-her", "anniversary"],
    seoTitle: "Rado True Ceramic, Black and Silver",
    seoDescription: "Rado True high-tech ceramic in black and silver. Water resistant, 6-month machine warranty.",
  },
  {
    name: "Chronograph — Master Lock",
    slug: "longbo-chronograph-master-lock",
    sku: "QC-LGB-8338",
    brand: "Longbo",
    shortDescription:
      "Cushion-case steel chronograph with a master-lock folding clasp, four dial colours and a stainless case-back.",
    description:
      "A cushion-shaped steel chronograph with three sub-dials and a folding master lock. Four colours are available: silver, blue, green and two-tone.\n\nThe case-back is engraved LONGBO NO. 8338G, stainless steel, water resistant.",
    story:
      "This is the watch for someone who wants a chronograph presence without a dress-watch price. The clasp is the detail — a secure fold that sits flat on the wrist.",
    price: 890000,
    stock: 7,
    newArrival: true,
    bestseller: true,
    bestsellerRank: 5,
    sortOrder: 8,
    images: [
      {
        url: "/media/lookbook/longbo-hero.jpg",
        alt: "Longbo chronograph with four colourways on dark slate",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/longbo-detail.jpg",
        alt: "Longbo Master Lock details — boxed watch, side profile, stainless back and folding clasp",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Quartz",
      "case-material": "Stainless steel",
      "case-shape": "Rectangular",
      "case-size": "42",
      crystal: "Mineral glass",
      "dial-colour": "Silver",
      "dial-detail": "Chronograph sub-dials, black bezel",
      "strap-material": "Steel bracelet",
      "strap-colour": "Silver",
      "water-resistance": "30",
      functions: "Hours, minutes, seconds, chronograph",
      gender: "Men",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["everyday-essentials"],
    tags: ["everyday", "sport", "for-him", "birthday"],
    seoTitle: "Longbo Chronograph, Master Lock",
    seoDescription: "Longbo cushion chronograph with master-lock clasp and four colours. Water resistant, 6-month machine warranty.",
  },
  {
    name: "Automatic — Cushion Leather",
    slug: "success-way-automatic-cushion-leather",
    sku: "QC-SW-AUT-01",
    brand: "Success Way",
    shortDescription:
      "Cushion-case automatic on genuine leather, two colours, with deployant clasp and premium box packing.",
    description:
      "A cushion automatic on alligator-embossed genuine leather — black or brown and gold. The dial is silver with a date at six; the clasp is a branded deployant.\n\nSix-month machine warranty and water resistance, packed in a black presentation box.",
    story:
      "Leather on a cushion case is the quiet luxury silhouette. Success Way is the piece we recommend when someone wants an automatic they will actually wear every day.",
    price: 790000,
    compareAtPrice: 950000,
    stock: 8,
    newArrival: true,
    sortOrder: 9,
    images: [
      {
        url: "/media/lookbook/success-way-hero.jpg",
        alt: "Success Way automatic cushion watch on cream stone with burgundy velvet",
        width: 1080,
        height: 1350,
      },
      {
        url: "/media/lookbook/success-way-detail.jpg",
        alt: "Success Way details — dial, slim profile, stainless back, leather strap, clasp and box",
        width: 1080,
        height: 1350,
      },
    ],
    attributes: {
      movement: "Automatic",
      "case-material": "Stainless steel",
      "case-shape": "Rectangular",
      "case-size": "40",
      crystal: "Mineral glass",
      "dial-colour": "Silver",
      "dial-detail": "Applied indices, date at six",
      "strap-material": "Genuine leather",
      "strap-colour": "Black",
      "water-resistance": "30",
      functions: "Hours, minutes, seconds, date",
      gender: "Men",
      warranty: "6 months machine warranty, Qalb Collections",
    },
    collections: ["the-dress-code", "everyday-essentials"],
    tags: ["classic", "formal", "for-him", "eid", "fathers-day"],
    seoTitle: "Success Way Automatic, Cushion Leather",
    seoDescription: "Success Way cushion automatic on genuine leather. Two colours, premium box, 6-month machine warranty.",
  },
];

/**
 * Perfume entries exist so the launch is a status flip rather than a data
 * migration. They sit in a COMING_SOON category and are flagged `comingSoon`,
 * so nothing here is purchasable until an editor says so.
 */
export const PERFUME_PRODUCTS: SeedProduct[] = [
  {
    name: "Qalb No.1 — Oud & Amber",
    slug: "qalb-no-1-oud-amber",
    sku: "QC-PRF-001",
    brand: "Qalb Collections",
    shortDescription: "Composition in development. A resinous oud opening settling into warm amber.",
    description:
      "The first Qalb fragrance is still being finalised with our perfumer. The direction is set: oud and amber, built for evening wear in a warm climate, with enough resin to last a long dinner and enough sweetness that it never turns medicinal.\n\nNotes below describe the current composition and may change before release.",
    story:
      "We are not launching a fragrance because it is the obvious next category. We are launching one because the same question keeps arriving in our inbox: what do you wear with the watch?\n\nNo.1 is the answer for evenings.",
    price: 950000,
    stock: 0,
    comingSoon: true,
    sortOrder: 0,
    images: [],
    attributes: {
      "fragrance-family": "Woody oriental",
      concentration: "Eau de Parfum",
      "top-notes": "Saffron, bergamot",
      "heart-notes": "Oud, Turkish rose",
      "base-notes": "Amber, sandalwood, vanilla",
      volume: "50",
      longevity: "In testing",
    },
    collections: [],
    tags: ["statement", "for-him", "eid", "anniversary"],
  },
  {
    name: "Qalb No.2 — Rose & Saffron",
    slug: "qalb-no-2-rose-saffron",
    sku: "QC-PRF-002",
    brand: "Qalb Collections",
    shortDescription: "Composition in development. Damask rose lifted by saffron over soft musk.",
    description:
      "A rose that is not sweet. Saffron gives the opening a dry, almost leathery edge before the rose arrives, and the base stays quiet so it can be worn in daylight.\n\nNotes below describe the current composition and may change before release.",
    story:
      "Rose is the most-used note in the region and the most misused. No.2 is our attempt at a rose that reads modern rather than nostalgic.",
    price: 950000,
    stock: 0,
    comingSoon: true,
    sortOrder: 1,
    images: [],
    attributes: {
      "fragrance-family": "Floral oriental",
      concentration: "Eau de Parfum",
      "top-notes": "Saffron, pink pepper",
      "heart-notes": "Damask rose, geranium",
      "base-notes": "White musk, cedar",
      volume: "50",
      longevity: "In testing",
    },
    collections: [],
    tags: ["classic", "for-her", "mothers-day", "wedding"],
  },
  {
    name: "Qalb No.3 — Cedar & Musk",
    slug: "qalb-no-3-cedar-musk",
    sku: "QC-PRF-003",
    brand: "Qalb Collections",
    shortDescription: "Composition in development. A clean cedar and musk built for daily wear.",
    description:
      "The everyday one. Dry cedar, a little citrus at the top, and a musk base that stays close to the skin — designed to be worn to work without announcing itself across a room.\n\nNotes below describe the current composition and may change before release.",
    story:
      "Most people do not want to be noticed for their fragrance. They want to be remembered for it. No.3 is built on that difference.",
    price: 850000,
    stock: 0,
    comingSoon: true,
    sortOrder: 2,
    images: [],
    attributes: {
      "fragrance-family": "Woody aromatic",
      concentration: "Eau de Toilette",
      "top-notes": "Bergamot, cardamom",
      "heart-notes": "Cedar, vetiver",
      "base-notes": "White musk, tonka",
      volume: "100",
      longevity: "In testing",
    },
    collections: [],
    tags: ["everyday", "minimal", "for-him", "for-her", "birthday"],
  },
];

// ---------------------------------------------------------------------------
// Taxonomy content
// ---------------------------------------------------------------------------

export const COLLECTIONS = [
  {
    name: "The Signature Edit",
    slug: "the-signature-edit",
    description: "The pieces we would choose first — one for the boardroom, one for the passport.",
    editorialIntro:
      "A short list, deliberately. These are the watches we hand to someone buying their first serious piece, and the ones we would keep if we had to keep two.",
    imageUrl: "/media/lookbook/tag-heuer-carrera-hero.jpg",
    featured: true,
    sortOrder: 0,
  },
  {
    name: "The Dress Code",
    slug: "the-dress-code",
    description: "Watches that sit flat under a cuff and finish an outfit rather than interrupt it.",
    editorialIntro:
      "A dress watch is not about formality. It is about proportion — thin enough to disappear, legible enough that you never have to look twice.",
    imageUrl: "/media/lookbook/cartier-tank-hero.jpg",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Everyday Essentials",
    slug: "everyday-essentials",
    description: "Steel, day-date, and nothing you have to think about at seven in the morning.",
    editorialIntro:
      "The watch you actually wear. Bracelet, day and date, and a case size that works with every sleeve you own.",
    imageUrl: "/media/lookbook/citizen-steel-hero.jpg",
    featured: true,
    sortOrder: 2,
  },
];

export const TAGS = [
  { slug: "everyday", label: "Everyday", kind: "style", sortOrder: 0 },
  { slug: "formal", label: "Formal", kind: "style", sortOrder: 1 },
  { slug: "classic", label: "Classic", kind: "style", sortOrder: 2 },
  { slug: "sport", label: "Sport", kind: "style", sortOrder: 3 },
  { slug: "statement", label: "Statement", kind: "style", sortOrder: 4 },
  { slug: "minimal", label: "Minimal", kind: "style", sortOrder: 5 },
  { slug: "for-him", label: "For Him", kind: "audience", sortOrder: 0 },
  { slug: "for-her", label: "For Her", kind: "audience", sortOrder: 1 },
  { slug: "birthday", label: "Birthday", kind: "occasion", sortOrder: 0 },
  { slug: "anniversary", label: "Anniversary", kind: "occasion", sortOrder: 1 },
  { slug: "wedding", label: "Wedding", kind: "occasion", sortOrder: 2 },
  { slug: "eid", label: "Eid", kind: "occasion", sortOrder: 3 },
  { slug: "graduation", label: "Graduation", kind: "occasion", sortOrder: 4 },
  { slug: "fathers-day", label: "Father's Day", kind: "occasion", sortOrder: 5 },
  { slug: "mothers-day", label: "Mother's Day", kind: "occasion", sortOrder: 6 },
];

// ---------------------------------------------------------------------------
// Editorial
// ---------------------------------------------------------------------------

export const JOURNAL_POSTS = [
  {
    title: "Automatic or quartz: which movement actually suits your week?",
    slug: "automatic-or-quartz-which-movement-suits-your-week",
    category: "Guides",
    excerpt:
      "The honest trade-offs between a self-winding mechanical movement and a quartz one — accuracy, upkeep, cost and the part nobody mentions.",
    readMinutes: 6,
    featured: true,
    coverImage: "/media/lookbook/tag-heuer-carrera-hero.jpg",
    coverAlt:
      "Close view of an automatic TAG Heuer Carrera dial showing the second-time-zone arrow and applied indices",
    body: `Most buying guides treat this as a status question. It is really a logistics question: how many days a week will the watch be on your wrist?

# What each one actually is

A **quartz** movement uses a battery to vibrate a quartz crystal at a fixed frequency. That frequency is stable, which is why quartz keeps time to within a few seconds a month.

An **automatic** movement has no battery. A weighted rotor spins as you move, winding a spring that drives the watch. It is a mechanical solution to a mechanical problem, and it has been refined for roughly a century.

# Accuracy

Quartz wins, and not narrowly.

- Quartz: around ±15 seconds per month
- Good automatic: around ±5 to ±10 seconds per *day*

An automatic that gains six seconds a day is running to specification. If that will irritate you every time you set it, you have your answer already.

# Upkeep

This is where the decision usually gets made.

An automatic needs to be worn — or wound — to keep running. Typical power reserve is around 40 hours, so a watch you wear Monday to Friday will be stopped by Sunday afternoon. That is not a fault; it is how the mechanism works. It does mean a two-watch rotation involves resetting one of them most weeks.

A quartz watch needs a battery every two to four years and nothing else.

Servicing is the larger number. An automatic should be serviced roughly every five to seven years. A quartz movement is usually replaced rather than serviced, at a fraction of the cost.

# Cost over ten years

Add it up honestly:

1. Automatic: purchase price, plus one or two services
2. Quartz: purchase price, plus three or four battery changes

The gap is real, and it is worth knowing before you buy rather than after.

# The part nobody mentions

An automatic seconds hand sweeps. A quartz one ticks.

That sounds trivial written down. In practice it is the single most common reason people who own both reach for the automatic. A sweeping hand makes the watch feel alive on the wrist, and there is no functional argument for it whatsoever.

# So which one

Choose **quartz** if the watch will be worn occasionally, if it is a gift, if it is going into a rotation, or if setting the time more than once a month would annoy you.

Choose **automatic** if it will be your daily watch, if you like the idea of owning something that runs on your own movement, and if you accept the servicing that comes with it.

Both are correct answers. Only one of them is correct for your week.`,
  },
  {
    title: "How to size a watch to your wrist (without a tape measure)",
    slug: "how-to-size-a-watch-to-your-wrist",
    category: "Guides",
    excerpt:
      "Case diameter is the number everyone quotes and the least useful one. Here is what actually determines whether a watch fits.",
    readMinutes: 5,
    featured: true,
    coverImage: "/media/lookbook/citizen-steel-hero.jpg",
    coverAlt: "38 mm steel Citizen watch with a silver-white Roman numeral dial resting on grey stone",
    body: `Ask what size watch to buy and you will be given a diameter. Diameter is only one of four numbers that matter, and it is not the most important one.

# Lug-to-lug is the real measurement

Diameter measures the case. **Lug-to-lug** measures the distance between the two points where the strap attaches — which is the actual footprint on your wrist.

If the lug-to-lug is longer than the flat part of your wrist, the lugs will overhang and the watch will rock. A 40 mm watch with long lugs can wear larger than a 42 mm watch with short, curved ones.

As a rough guide, keep lug-to-lug under about 48 mm for a 16 cm wrist, and under about 52 mm for an 18 cm wrist.

# Thickness decides whether you keep it

A thick watch catches on cuffs. You will notice it every time you put on a shirt, and eventually you will stop wearing it.

- Under 9 mm: disappears under any cuff
- 9 to 12 mm: fine for daily wear
- Over 13 mm: expect to think about your sleeves

# Diameter, in context

Now that the other two numbers are handled, diameter mostly changes how the watch *reads* rather than how it fits.

- 34 to 37 mm: classical, dressy, reads vintage
- 38 to 40 mm: the modern default, works on almost every wrist
- 41 to 44 mm: sport and travel watches, needs the wrist to carry it

Case shape matters here too. A rectangular case at 25 mm across can wear as substantially as a 36 mm round one, because the eye reads the whole rectangle.

# Measure without a tape

Wrap a strip of paper around your wrist where you wear a watch, mark where it overlaps, then lay it flat against a ruler. That circumference is the number to keep in your notes.

Alternatively, find a watch you already like the fit of and note its diameter and lug-to-lug. It is a better reference point than any chart.

# The test that settles it

Put it on and look at your wrist from directly above, arm relaxed at your side. If you can see wrist on both sides of the case, the size is right. If the lugs point outward into air, go smaller.

Everything else is preference.`,
  },
  {
    title: "Keeping a leather strap alive through a Pakistani summer",
    slug: "caring-for-a-leather-strap-in-a-hot-climate",
    category: "Care",
    excerpt:
      "Heat and perspiration will destroy a leather strap faster than years of wear. Four habits that prevent it.",
    readMinutes: 4,
    coverImage: "/media/lookbook/cartier-tank-hero.jpg",
    coverAlt: "Black grained leather watch strap with a gold-tone buckle on a Cartier Tank",
    body: `Leather fails from the inside. The surface you look at is usually fine long after the underside has hardened, cracked and started to smell — and by then it is not recoverable.

Here is what actually extends its life.

# Give it a day off

Perspiration is the problem, not heat by itself. Salt crystallises in the fibres as the strap dries and cuts them from within.

Rotating between two watches, or simply taking the watch off for an evening, lets the strap dry fully. This single habit does more than every conditioner sold.

# Loosen it before you take it off

Most straps crack at the buckle hole and along the fold. That damage happens during removal, when the leather is bent sharply while damp.

Unbuckle first, then slide it off. It takes two extra seconds.

# Dry it properly, once

If the strap gets soaked:

1. Blot it with a dry cloth — do not rub
2. Leave it somewhere shaded with air moving
3. Never use a hairdryer, a radiator or direct sun

Fast drying shrinks leather unevenly and it will not come back.

# Condition rarely, and lightly

Twice a year is enough, and less is safer than more.

Use a neutral leather balm, apply it with a cloth rather than your fingers, and keep it off the stitching — oil rots thread. Wipe away anything that has not absorbed within ten minutes.

# When to replace rather than rescue

Replace the strap if:

- The underside has gone stiff or shiny
- There are cracks across the fold, not just surface creases
- It has developed a smell that survives airing

A new strap is a fraction of the price of the watch and will make it feel new. Holding on to a dead one is the only real mistake.

# One note on bracelets

If you have a steel bracelet, the equivalent maintenance is a soft toothbrush, warm water and a drop of mild soap, twice a year, with the watch off. Dry it fully before wearing. Grit between the links is what wears a bracelet out, not use.`,
  },
  {
    title: "The case for owning one good watch",
    slug: "the-case-for-owning-one-good-watch",
    category: "Perspective",
    excerpt:
      "A collection is a hobby. One well-chosen watch is a decision — and it is usually the better one.",
    readMinutes: 4,
    coverImage: "/media/lookbook/citizen-black-hero.jpg",
    coverAlt: "Black-finished Citizen quartz day-date watch beside its presentation box",
    body: `The internet is very good at persuading you that you need a dress watch, a sports watch, a travel watch and something for the weekend. Most people need one watch that handles all four.

# What one watch has to do

It has to work with the clothes you actually own, be legible without effort, survive being worn daily, and not embarrass you at either end of the formality range.

That is a narrower brief than it sounds, and it points fairly consistently at the same specification: a 36 to 40 mm case, a dial you can read in one glance, and a strap or bracelet you can swap.

# Why the single watch usually wins

**You wear it.** A watch in a drawer is a possession. A watch on your wrist is a habit, and habits are what make an object mean anything.

**It ages.** Straps soften, steel picks up marks, and a watch that has been worn every day for five years looks like yours in a way a rotation never does.

**You stop shopping.** The decision is made, which is quietly worth more than the money saved.

# When more than one is genuinely right

There are honest exceptions.

- You need a mechanical watch and a quartz one because you travel and cannot reset a watch on landing
- Your work is hard on a watch and you keep something better for evenings
- You enjoy watches as a subject, which is a perfectly good reason and does not need a practical justification

# How to choose the one

Ignore what a watch says about you and ask what it does for you.

1. Pick the size that fits, using lug-to-lug rather than diameter
2. Pick the dial you can read fastest
3. Pick the movement that matches how often you will wear it
4. Buy the best finishing you can afford at that specification

Finishing is where money shows. A well-finished case at a modest price will outlast a poorly finished one that cost more, and it will keep looking deliberate.

# Then stop

Wear it. Get it serviced when it asks. Replace the strap when the strap is done.

That is the whole practice.`,
  },
];

export const LEGAL_PAGES = [
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    seoDescription:
      "How Qalb Collections collects, uses and protects your personal information when you shop with us.",
    body: `We collect the minimum information needed to sell you a watch and deliver it. This page explains exactly what that means.

# What we collect

**When you place an order:** your name, email address, phone number and delivery address. We need all four to fulfil and deliver the order.

**When you create an account:** the above, plus a password which is stored only as a one-way hash. We cannot read your password and neither can anyone with access to our database.

**When you browse:** your wishlist, comparison list and recently viewed items are stored in your own browser. They are not sent to us unless you sign in and choose to sync them.

**When you subscribe:** your email address, and the page you subscribed from.

# What we do not collect

We do not collect card details. Payment is handled by cash on delivery or bank transfer, so no card data reaches our servers.

We do not sell, rent or share your personal information with third parties for marketing.

# How we use it

- To process, pack and deliver your order
- To contact you about that order
- To handle returns, exchanges and warranty claims
- To send you email updates, only if you asked for them

# Cookies

We use one essential cookie to remember your cart, and one to keep you signed in if you have an account. Neither is used for advertising.

If analytics are enabled, they are configured to record page and product events without building an advertising profile of you.

# Your choices

You can:

- Unsubscribe from email at any time using the link in any message
- Ask us to correct your details
- Ask us to delete your account and personal data, subject to records we must keep for completed orders

Write to us and we will action it.

# Retention

Order records are kept for accounting purposes. Account data is kept until you ask us to remove it. Wishlist and browsing data held in your browser can be cleared by you at any time.

# Changes

If this policy changes materially, we will update this page and the date below.

# Contact

Questions about your data should go to our customer care address, listed on the [contact page](/contact).`,
  },
  {
    title: "Terms of Service",
    slug: "terms",
    seoDescription:
      "The terms that apply when you browse or buy from Qalb Collections, including orders, pricing and warranty.",
    body: `These terms apply when you use this website or place an order with Qalb Collections.

# Orders

Placing an order is an offer to buy. We confirm it by message or email, and a contract exists from that confirmation.

We may decline or cancel an order if:

- The item is no longer available
- The price or description was listed in error
- We cannot verify the delivery address or contact details

If we cancel a confirmed order, you pay nothing and any amount already received is returned in full.

# Pricing

Prices are shown in Pakistani Rupees and include applicable taxes unless stated otherwise. Delivery charges, if any, are shown before you confirm the order.

We correct pricing errors rather than honour them. If a corrected price is higher than what you were shown, you may cancel without charge.

# Product information

We describe every piece as accurately as we can, including its condition. Photography is of the actual stock wherever possible.

Screen colour varies between devices. A dial that reads black on your phone may read anthracite in daylight, and vice versa.

# Availability

Stock is limited and shown per product. An item in your cart is not reserved until the order is confirmed.

# Warranty

Watches sold by us carry the warranty stated on the product page, covering the movement against manufacturing defect from the date of delivery.

The warranty does not cover:

- Battery replacement
- Straps, bracelets, buckles and crystals
- Water damage where the stated resistance was exceeded
- Damage from impact, misuse or unauthorised opening of the case

# Returns

Returns are governed by our [returns policy](/returns-policy), which forms part of these terms.

# Acceptable use

Do not attempt to interfere with the site, extract data at scale, or resell our photography or written content without permission.

# Liability

Our liability for any order is limited to the amount you paid for it. Nothing in these terms limits liability that cannot be limited by law.

# Governing law

These terms are governed by the laws of Pakistan.

# Changes

We may update these terms. The version in force is the one published here when you place your order.`,
  },
  {
    title: "Shipping Policy",
    slug: "shipping-policy",
    seoDescription:
      "Delivery timeframes, charges and courier information for Qalb Collections orders across Pakistan.",
    body: `# Where we deliver

We deliver across Pakistan. For international delivery, contact us before ordering so we can quote the courier and confirm what is possible.

# Timeframes

Orders are packed within one working day of confirmation.

- Major cities: typically 2 to 3 working days after dispatch
- Elsewhere in Pakistan: typically 3 to 5 working days after dispatch

These are courier estimates, not guarantees. Public holidays and weather affect them.

# Charges

Delivery charges, if applicable to your order, are calculated and shown at checkout before you confirm. There are no charges added afterwards.

# Confirmation before dispatch

For cash on delivery orders we call or message to confirm your address before handing the parcel to the courier. If we cannot reach you after two attempts across two days, the order is held rather than dispatched.

# How we pack

Every watch ships in its box where one was supplied, inside a rigid outer carton with protective fill. Parcels are unbranded on the outside.

# Tracking

You receive a tracking reference by message once the parcel is collected.

# On delivery

Check the parcel before the courier leaves, particularly for cash on delivery orders. If the outer carton is damaged or opened, refuse it and tell us the same day.

# Failed delivery

If a courier cannot deliver after their standard attempts, the parcel returns to us. We will contact you to arrange a second dispatch. A repeat delivery charge may apply.

# Questions

Anything not covered here, ask us on the [contact page](/contact).`,
  },
  {
    title: "Returns & Exchanges",
    slug: "returns-policy",
    seoDescription:
      "How to return or exchange a watch bought from Qalb Collections, including the return window and condition requirements.",
    body: `We want you to keep the watch because it suits you, not because returning it was difficult.

# The window

You may request a return within **7 days** of delivery.

Contact us first. Returns sent without being raised with us cannot be tracked to your order.

# Condition

To be accepted, the piece must be:

- Unworn beyond trying it on
- Free of scratches, marks and strap creasing
- Complete, with the box, tags, papers and any protective film as delivered

We inspect every return. A watch showing wear cannot be accepted, because we cannot sell it as new to the next customer.

# What is not returnable

- Items marked final sale on the product page
- Special orders sourced specifically for you
- Any item where the case has been opened

# Exchanges

If the size or style is wrong, an exchange is usually simpler than a return. Tell us what you would prefer and we will confirm availability and any price difference before arranging collection.

# Faults and warranty

A fault is not a return. If a watch develops a movement fault within its warranty period, contact us and we will arrange assessment and repair or replacement.

Report anything that arrived damaged or incorrect within 48 hours of delivery, with photographs. We cover the cost of putting it right.

# Return shipping

- Our error, a fault, or a damaged delivery: we arrange and pay for collection
- Change of mind: return shipping is yours to arrange and pay for

# Refunds

Once the return is received and inspected, refunds are issued to your original payment method, or by bank transfer for cash on delivery orders. Allow up to 7 working days from inspection.

Original delivery charges are refunded only where the return is due to our error or a fault.

# How to start

Message us with your order number and what you would like to do. We will reply with the next step the same working day.`,
  },
];

export const GLOBAL_FAQS = [
  {
    question: "Are your watches authentic?",
    answer:
      "Every piece is described exactly as it is, including its condition, and photographed as the actual stock wherever possible. If you have a question about a specific piece before buying, ask us and we will answer it plainly.",
  },
  {
    question: "What warranty do I get?",
    answer:
      "Watches carry the warranty stated on their product page, covering the movement against manufacturing defect from the date of delivery. Batteries, straps, bracelets, crystals and water damage beyond the stated resistance are not covered.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders are packed within one working day. Delivery is typically 2 to 3 working days to major cities and 3 to 5 working days elsewhere in Pakistan. You receive a tracking reference once the parcel is collected.",
  },
  {
    question: "Can I pay cash on delivery?",
    answer:
      "Yes, across Pakistan. We confirm your address by phone or message before dispatch. Bank transfer is also available if you prefer to pay in advance.",
  },
  {
    question: "Can I return a watch if it does not suit me?",
    answer:
      "Yes, within 7 days of delivery, provided it is unworn and complete with its box and tags. Raise the return with us first so we can track it to your order.",
  },
  {
    question: "How do I know which size will fit me?",
    answer:
      "Look at lug-to-lug rather than case diameter — it is the measurement that decides whether a watch sits flat on your wrist. Our journal has a short guide, and you are welcome to send us your wrist measurement and we will tell you honestly whether a piece will work.",
  },
];

// ---------------------------------------------------------------------------
// Homepage & navigation
// ---------------------------------------------------------------------------

export const HOME_SECTIONS = [
  {
    key: "art-of-time",
    eyebrow: "The Qalb approach",
    title: "We would rather sell you one watch than four.",
    body: "Qalb Collections is a small, deliberately narrow catalogue. Every piece is chosen because it does something well — a proportion that works, a dial you can read in one glance, finishing that will still look considered in five years. If a watch is not better than something already on the shelf, we do not stock it.\n\nQalb means heart. The name is a reminder that this is meant to be a considered purchase, not an impulse.",
    ctaLabel: "Our story",
    ctaHref: "/about",
    sortOrder: 10,
  },
  {
    key: "featured",
    eyebrow: "Featured",
    title: "Chosen first",
    body: "The pieces we reach for when someone asks where to start.",
    ctaLabel: "All watches",
    ctaHref: "/watches",
    sortOrder: 20,
  },
  {
    key: "signature-collection",
    eyebrow: "Signature collection",
    title: "The Signature Edit",
    body: "A short list, deliberately. One for the boardroom, one for the passport.",
    ctaLabel: "View the edit",
    ctaHref: "/collection/the-signature-edit",
    sortOrder: 30,
  },
  {
    key: "watch-finder",
    eyebrow: "Find your timepiece",
    title: "Tell us how you live. We will narrow it down.",
    body: "Four questions, no email required. We match what you tell us against movement, case size, strap and price — and show you the pieces that actually fit, including the ones that do not.",
    ctaLabel: "Start",
    ctaHref: "/find-your-timepiece",
    sortOrder: 40,
  },
  {
    key: "new-arrivals",
    eyebrow: "New in",
    title: "Recently added",
    ctaLabel: "All new arrivals",
    ctaHref: "/new-arrivals",
    sortOrder: 50,
  },
  {
    key: "editorial-story",
    eyebrow: "Detail",
    title: "Everything on this dial has a job.",
    body: "The applied indices are faceted so they catch light from any angle. The minute track is fine enough to read at a glance but not so fine that it turns to noise. And the red-tipped arrow — the only colour permitted on the dial — points to a second time zone.\n\nThat is the difference between decoration and design.",
    ctaLabel: "See the Carrera",
    ctaHref: "/product/tag-heuer-carrera-twin-time-automatic-anthracite",
    imageUrl: "/media/lookbook/tag-heuer-carrera-hero.jpg",
    sortOrder: 60,
  },
  {
    key: "bestsellers",
    eyebrow: "Most chosen",
    title: "Bestsellers",
    ctaLabel: "All watches",
    ctaHref: "/watches",
    sortOrder: 70,
  },
  {
    key: "perfumes-coming-soon",
    eyebrow: "Next from Qalb",
    title: "The scent of what's next",
    body: "Three compositions, in development with our perfumer. Built for evenings, for daylight, and for the space between. Join the list and you will hear before anyone else.",
    ctaLabel: "Qalb Perfumes",
    ctaHref: "/perfumes",
    sortOrder: 80,
  },
  {
    key: "why-qalb",
    eyebrow: "Why Qalb",
    title: "What you can expect from us",
    sortOrder: 90,
  },
  {
    key: "gift-guide",
    eyebrow: "Gifting",
    title: "Find the perfect gift",
    body: "Tell us the occasion and who it is for. We will show you what works — and wrap it properly.",
    ctaLabel: "Open the gift guide",
    ctaHref: "/gift-guide",
    sortOrder: 100,
  },
  {
    key: "journal",
    eyebrow: "Qalb Journal",
    title: "Worth reading before you buy",
    body: "Guides written to be useful, not to rank.",
    ctaLabel: "Read the journal",
    ctaHref: "/journal",
    sortOrder: 110,
  },
  {
    key: "newsletter",
    eyebrow: "Stay close",
    title: "New arrivals, before the grid",
    body: "One email when something arrives worth telling you about. Nothing else.",
    sortOrder: 120,
  },
];

export const TRUST_POINTS = [
  {
    title: "Described honestly",
    body: "Every piece is listed with its actual condition and photographed as the stock you will receive. If we are unsure of a specification, we say so rather than guess.",
  },
  {
    title: "Warranty in writing",
    body: "The warranty term is printed on each product page and honoured from the date of delivery. What it covers, and what it does not, is stated plainly.",
  },
  {
    title: "Packed to arrive intact",
    body: "Boxed where a box was supplied, inside a rigid carton with protective fill, in unbranded outer packaging.",
  },
  {
    title: "Seven days to change your mind",
    body: "Return an unworn piece within seven days of delivery. Raise it with us first and we will handle the rest.",
  },
  {
    title: "Answered by a person",
    body: "Questions about sizing, movement or condition get a direct answer from someone who has handled the watch.",
  },
  {
    title: "Cash on delivery",
    body: "Pay the courier when it arrives, anywhere in Pakistan. Bank transfer if you would rather settle in advance.",
  },
];

export const HEADER_NAV = [
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "All watches", href: "/watches" },
      { label: "New arrivals", href: "/new-arrivals" },
      { label: "Best sellers", href: "/best-sellers" },
      { label: "Perfumes", href: "/perfumes", badge: "Coming soon" },
    ],
  },
  {
    label: "Collections",
    href: "/collections",
    children: [
      { label: "The Signature Edit", href: "/collection/the-signature-edit" },
      { label: "The Dress Code", href: "/collection/the-dress-code" },
      { label: "Everyday Essentials", href: "/collection/everyday-essentials" },
    ],
  },
  {
    label: "Discover",
    href: "/find-your-timepiece",
    children: [
      { label: "Find your timepiece", href: "/find-your-timepiece" },
      { label: "Gift guide", href: "/gift-guide" },
      { label: "Compare", href: "/compare" },
    ],
  },
  { label: "Journal", href: "/journal", children: [] },
  { label: "About", href: "/about", children: [] },
  { label: "Contact", href: "/contact", children: [] },
];

export const FOOTER_NAV = [
  {
    group: "Shop",
    items: [
      { label: "All watches", href: "/watches" },
      { label: "New arrivals", href: "/new-arrivals" },
      { label: "Best sellers", href: "/best-sellers" },
      { label: "Collections", href: "/collections" },
      { label: "Perfumes", href: "/perfumes" },
    ],
  },
  {
    group: "Discover",
    items: [
      { label: "Find your timepiece", href: "/find-your-timepiece" },
      { label: "Gift guide", href: "/gift-guide" },
      { label: "Compare watches", href: "/compare" },
      { label: "Qalb Journal", href: "/journal" },
      { label: "About Qalb", href: "/about" },
    ],
  },
  {
    group: "Customer care",
    items: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping", href: "/shipping-policy" },
      { label: "Returns & exchanges", href: "/returns-policy" },
      { label: "FAQs", href: "/faqs" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    group: "Legal",
    items: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
];

export const ANNOUNCEMENTS = [
  { message: "Complimentary delivery across Pakistan on orders over Rs 15,000", sortOrder: 0 },
  { message: "Cash on delivery available nationwide", sortOrder: 1 },
  { message: "Qalb Perfumes — join the list", href: "/perfumes", sortOrder: 2 },
];
