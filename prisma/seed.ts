import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ANNOUNCEMENTS,
  COLLECTIONS,
  FOOTER_NAV,
  GLOBAL_FAQS,
  HEADER_NAV,
  HOME_SECTIONS,
  JOURNAL_POSTS,
  LEGAL_PAGES,
  PERFUME_ATTRIBUTES,
  PERFUME_PRODUCTS,
  TAGS,
  WATCH_ATTRIBUTES,
  WATCH_PRODUCTS,
  type SeedAttributeDefinition,
  type SeedProduct,
} from "./seed-content";

/**
 * Idempotent seed. Safe to re-run: everything is upserted by its natural key,
 * so `npm run db:seed` refreshes content without duplicating rows.
 */

const db = new PrismaClient();

const SETTINGS: { key: string; value: string; group: string }[] = [
  { key: "brandName", value: "Qalb Collections", group: "brand" },
  { key: "tagline", value: "Timeless precision, chosen with intent.", group: "brand" },
  { key: "supportEmail", value: "care@qalbcollections.com", group: "contact" },
  { key: "whatsappNumber", value: "", group: "contact" },
  { key: "phoneDisplay", value: "", group: "contact" },
  { key: "addressLine", value: "Lahore, Pakistan", group: "contact" },
  { key: "instagramUrl", value: "", group: "social" },
  { key: "facebookUrl", value: "", group: "social" },
  { key: "tiktokUrl", value: "", group: "social" },
  { key: "currency", value: "PKR", group: "commerce" },
  { key: "shippingFlatRate", value: "35000", group: "commerce" },
  { key: "freeShippingThreshold", value: "1500000", group: "commerce" },
  { key: "taxRateBps", value: "0", group: "commerce" },
  { key: "shippingLeadTime", value: "2–5 working days", group: "content" },
  { key: "returnsWindowDays", value: "7", group: "content" },
  {
    key: "perfumesLaunchNote",
    value: "Three compositions are in development with our perfumer. Join the list to hear first.",
    group: "content",
  },
  { key: "enableReviews", value: "true", group: "commerce" },
  { key: "enableGuestCheckout", value: "true", group: "commerce" },
];

async function seedSettings() {
  for (const setting of SETTINGS) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      update: { group: setting.group },
      create: setting,
    });
  }
  console.log(`  settings: ${SETTINGS.length}`);
}

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@qalbcollections.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db.adminUser.upsert({
    where: { email: adminEmail },
    update: { role: "SUPER_ADMIN", active: true, passwordHash },
    create: { name: "Qalb Owner", email: adminEmail, passwordHash, role: "SUPER_ADMIN" },
  });

  // One account per role so RBAC can be verified without creating users by hand.
  const supportingAdmins = [
    { name: "[DEMO] Catalogue Editor", email: "editor@qalbcollections.com", role: "EDITOR" },
    { name: "[DEMO] Order Desk", email: "orders@qalbcollections.com", role: "ORDER_MANAGER" },
  ];
  for (const admin of supportingAdmins) {
    await db.adminUser.upsert({
      where: { email: admin.email },
      update: { role: admin.role },
      create: { ...admin, passwordHash },
    });
  }

  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com";
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? "ChangeMe!2026";
  const customer = await db.customer.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: "[DEMO] Ayesha Khan",
      email: customerEmail,
      phone: "+92 300 0000000",
      passwordHash: await bcrypt.hash(customerPassword, 12),
      marketingOptIn: true,
    },
  });

  await db.address.deleteMany({ where: { customerId: customer.id } });
  await db.address.create({
    data: {
      customerId: customer.id,
      label: "Home",
      line1: "12 Gulberg III",
      city: "Lahore",
      region: "Punjab",
      postalCode: "54660",
      isDefault: true,
    },
  });

  console.log(`  admins: 3 · customers: 1`);
  return { adminEmail, customerId: customer.id };
}

async function seedCategories() {
  const watches = await db.category.upsert({
    where: { slug: "watches" },
    update: { status: "ACTIVE" },
    create: {
      name: "Watches",
      slug: "watches",
      status: "ACTIVE",
      featured: true,
      sortOrder: 0,
      imageUrl: "/media/lookbook/tag-heuer-carrera-hero.jpg",
      description:
        "A narrow, considered selection of timepieces — automatic and quartz, dress and everyday — chosen for proportion, legibility and finishing.",
      editorialIntro:
        "We stock fewer watches than we could. Each one is here because it does something well: a case size that works on a real wrist, a dial you can read without thinking, and finishing that will still look deliberate in five years.",
      seoTitle: "Luxury Watches in Pakistan",
      seoDescription:
        "Shop a curated selection of premium watches at Qalb Collections — automatic and quartz timepieces with warranty, cash on delivery and nationwide shipping.",
    },
  });

  const perfumes = await db.category.upsert({
    where: { slug: "perfumes" },
    update: {},
    create: {
      name: "Perfumes",
      slug: "perfumes",
      // The launch is a status change, not a deployment.
      status: "COMING_SOON",
      featured: true,
      sortOrder: 1,
      description:
        "Three compositions in development — built for a warm climate, and for people who would rather be remembered than noticed.",
      editorialIntro:
        "Qalb Perfumes begins with three fragrances: one for evenings, one for daylight, and one for the space between.",
      seoTitle: "Qalb Perfumes — Coming Soon",
      seoDescription:
        "Qalb Perfumes is in development. Three compositions built for a warm climate. Join the list to hear first.",
    },
  });

  console.log("  categories: 2 (watches ACTIVE, perfumes COMING_SOON)");
  return { watches, perfumes };
}

async function seedAttributeDefinitions(
  categoryId: string,
  definitions: SeedAttributeDefinition[],
) {
  for (const [index, definition] of definitions.entries()) {
    await db.attributeDefinition.upsert({
      where: { categoryId_key: { categoryId, key: definition.key } },
      update: {
        label: definition.label,
        unit: definition.unit ?? null,
        type: definition.type,
        group: definition.group,
        filterable: definition.filterable ?? false,
        comparable: definition.comparable ?? false,
        showInSpecs: definition.showInSpecs ?? true,
        sortOrder: index,
      },
      create: {
        categoryId,
        key: definition.key,
        label: definition.label,
        unit: definition.unit ?? null,
        type: definition.type,
        group: definition.group,
        filterable: definition.filterable ?? false,
        comparable: definition.comparable ?? false,
        showInSpecs: definition.showInSpecs ?? true,
        sortOrder: index,
      },
    });
  }
}

async function seedCollections() {
  for (const collection of COLLECTIONS) {
    await db.collection.upsert({
      where: { slug: collection.slug },
      update: { ...collection, status: "ACTIVE" },
      create: { ...collection, status: "ACTIVE" },
    });
  }
  console.log(`  collections: ${COLLECTIONS.length}`);
}

async function seedTags() {
  for (const tag of TAGS) {
    await db.tag.upsert({ where: { slug: tag.slug }, update: tag, create: tag });
  }
  console.log(`  tags: ${TAGS.length}`);
}

async function seedProducts(categoryId: string, products: SeedProduct[]) {
  for (const seed of products) {
    const product = await db.product.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        sku: seed.sku,
        brand: seed.brand,
        shortDescription: seed.shortDescription,
        description: seed.description,
        story: seed.story,
        categoryId,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice ?? null,
        stock: seed.stock,
        lowStockThreshold: seed.lowStockThreshold ?? 2,
        status: "ACTIVE",
        featured: seed.featured ?? false,
        newArrival: seed.newArrival ?? false,
        bestseller: seed.bestseller ?? false,
        comingSoon: seed.comingSoon ?? false,
        limited: seed.limited ?? false,
        exclusive: seed.exclusive ?? false,
        sortOrder: seed.sortOrder,
        seoTitle: seed.seoTitle ?? null,
        seoDescription: seed.seoDescription ?? null,
        publishedAt: new Date(),
      },
      create: {
        name: seed.name,
        slug: seed.slug,
        sku: seed.sku,
        brand: seed.brand,
        shortDescription: seed.shortDescription,
        description: seed.description,
        story: seed.story,
        categoryId,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice ?? null,
        currency: "PKR",
        stock: seed.stock,
        lowStockThreshold: seed.lowStockThreshold ?? 2,
        status: "ACTIVE",
        featured: seed.featured ?? false,
        newArrival: seed.newArrival ?? false,
        bestseller: seed.bestseller ?? false,
        comingSoon: seed.comingSoon ?? false,
        limited: seed.limited ?? false,
        exclusive: seed.exclusive ?? false,
        sortOrder: seed.sortOrder,
        seoTitle: seed.seoTitle ?? null,
        seoDescription: seed.seoDescription ?? null,
        publishedAt: new Date(),
      },
    });

    // Images, attributes and joins are replaced wholesale so the seed file is
    // the single source of truth on every run.
    await db.productImage.deleteMany({ where: { productId: product.id } });
    for (const [index, image] of seed.images.entries()) {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: image.url,
          alt: image.alt,
          width: image.width,
          height: image.height,
          sortOrder: index,
          isPrimary: index === 0,
        },
      });
      await db.mediaAsset.upsert({
        where: { url: image.url },
        update: { alt: image.alt, width: image.width, height: image.height },
        create: {
          url: image.url,
          filename: image.url.split("/").pop() ?? image.url,
          alt: image.alt,
          mimeType: image.url.endsWith(".jpg") || image.url.endsWith(".jpeg") ? "image/jpeg" : "image/png",
          width: image.width,
          height: image.height,
          folder: "lookbook",
        },
      });
    }

    await db.productAttribute.deleteMany({ where: { productId: product.id } });
    for (const [key, value] of Object.entries(seed.attributes)) {
      const definition = await db.attributeDefinition.findUnique({
        where: { categoryId_key: { categoryId, key } },
      });
      if (!definition) {
        console.warn(`  ! no attribute definition "${key}" for ${seed.slug}`);
        continue;
      }
      const numeric = Number.parseFloat(value);
      await db.productAttribute.create({
        data: {
          productId: product.id,
          definitionId: definition.id,
          value,
          valueNumber: definition.type === "NUMBER" && Number.isFinite(numeric) ? numeric : null,
        },
      });
    }

    await db.productCollection.deleteMany({ where: { productId: product.id } });
    for (const [index, slug] of seed.collections.entries()) {
      const collection = await db.collection.findUnique({ where: { slug } });
      if (collection) {
        await db.productCollection.create({
          data: { productId: product.id, collectionId: collection.id, sortOrder: index },
        });
      }
    }

    await db.productTag.deleteMany({ where: { productId: product.id } });
    for (const slug of seed.tags) {
      const tag = await db.tag.findUnique({ where: { slug } });
      if (tag) {
        await db.productTag.create({ data: { productId: product.id, tagId: tag.id } });
      }
    }

    await db.productVariant.deleteMany({ where: { productId: product.id } });
    for (const [index, variant] of (seed.variants ?? []).entries()) {
      await db.productVariant.create({
        data: { productId: product.id, ...variant, sortOrder: index },
      });
    }

    await db.faq.deleteMany({ where: { productId: product.id } });
    for (const [index, faq] of (seed.faqs ?? []).entries()) {
      await db.faq.create({ data: { productId: product.id, ...faq, sortOrder: index } });
    }
  }
}

async function seedGlobalFaqs() {
  await db.faq.deleteMany({ where: { productId: null } });
  for (const [index, faq] of GLOBAL_FAQS.entries()) {
    await db.faq.create({ data: { ...faq, sortOrder: index } });
  }
  console.log(`  faqs: ${GLOBAL_FAQS.length} global`);
}

async function seedCms() {
  await db.banner.deleteMany({ where: { placement: "home_hero" } });
  await db.banner.create({
    data: {
      placement: "home_hero",
      eyebrow: "Qalb Collections",
      title: "Timeless precision.",
      subtitle: "Curated timepieces for those who appreciate the details.",
      imageUrl: "/media/lookbook/cartier-tank-hero.jpg",
      imageAlt:
        "Cartier Tank rectangular watch with a gold-tone case and black dial on black grained leather, resting on a navy suit beside a blue silk tie",
      ctaLabel: "Explore watches",
      ctaHref: "/watches",
      ctaLabel2: "Discover Qalb",
      ctaHref2: "/about",
      sortOrder: 0,
      active: true,
    },
  });

  for (const section of HOME_SECTIONS) {
    await db.homeSection.upsert({
      where: { key: section.key },
      update: section,
      create: section,
    });
  }

  await db.navItem.deleteMany({});
  for (const [index, item] of HEADER_NAV.entries()) {
    const parent = await db.navItem.create({
      data: { label: item.label, href: item.href, location: "header", sortOrder: index },
    });
    for (const [childIndex, child] of item.children.entries()) {
      await db.navItem.create({
        data: {
          label: child.label,
          href: child.href,
          location: "header",
          parentId: parent.id,
          badge: "badge" in child ? (child.badge as string) : null,
          sortOrder: childIndex,
        },
      });
    }
  }
  for (const [groupIndex, group] of FOOTER_NAV.entries()) {
    for (const [index, item] of group.items.entries()) {
      await db.navItem.create({
        data: {
          label: item.label,
          href: item.href,
          location: "footer",
          groupName: group.group,
          sortOrder: groupIndex * 100 + index,
        },
      });
    }
  }

  await db.announcement.deleteMany({});
  for (const announcement of ANNOUNCEMENTS) {
    await db.announcement.create({ data: announcement });
  }

  for (const page of LEGAL_PAGES) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: { ...page, status: "ACTIVE" },
    });
  }

  for (const [index, post] of JOURNAL_POSTS.entries()) {
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...post, status: "ACTIVE" },
      create: {
        ...post,
        status: "ACTIVE",
        publishedAt: new Date(Date.now() - index * 9 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(
    `  cms: 1 hero · ${HOME_SECTIONS.length} sections · ${LEGAL_PAGES.length} pages · ${JOURNAL_POSTS.length} journal posts`,
  );
}

async function seedCoupon() {
  await db.coupon.upsert({
    where: { code: "QALB10" },
    update: { active: true },
    create: {
      code: "QALB10",
      description: "[DEMO] 10% off orders over Rs 10,000",
      type: "PERCENT",
      value: 10,
      minSubtotal: 1000000,
      active: true,
    },
  });
  console.log("  coupons: 1 (QALB10)");
}

async function seedDemoOrders(customerId: string) {
  const products = await db.product.findMany({
    where: { comingSoon: false },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { price: "desc" },
  });
  if (products.length === 0) return;

  const scenarios: { status: string; paymentStatus: string; daysAgo: number; picks: number[] }[] = [
    { status: "DELIVERED", paymentStatus: "PAID", daysAgo: 26, picks: [0] },
    { status: "SHIPPED", paymentStatus: "PAID", daysAgo: 11, picks: [1, 3] },
    { status: "PROCESSING", paymentStatus: "PENDING", daysAgo: 4, picks: [2] },
    { status: "PENDING", paymentStatus: "UNPAID", daysAgo: 1, picks: [3] },
  ];

  await db.order.deleteMany({ where: { orderNumber: { startsWith: "QC-DEMO-" } } });

  for (const [index, scenario] of scenarios.entries()) {
    const createdAt = new Date(Date.now() - scenario.daysAgo * 24 * 60 * 60 * 1000);
    const picked = scenario.picks
      .map((position) => products[position % products.length]!)
      .filter(Boolean);

    const items = picked.map((product) => ({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      imageUrl: product.images[0]?.url ?? null,
      quantity: 1,
      unitPrice: product.price,
      lineTotal: product.price,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingTotal = subtotal >= 1500000 ? 0 : 35000;

    const order = await db.order.create({
      data: {
        orderNumber: `QC-DEMO-${String(1001 + index)}`,
        customerId: index % 2 === 0 ? customerId : null,
        customerName: index % 2 === 0 ? "[DEMO] Ayesha Khan" : "[DEMO] Hamza Siddiqui",
        customerEmail: index % 2 === 0 ? "customer@example.com" : "hamza@example.com",
        customerPhone: "+92 300 0000000",
        status: scenario.status,
        paymentStatus: scenario.paymentStatus,
        paymentMethod: index % 2 === 0 ? "cod" : "bank_transfer",
        subtotal,
        shippingTotal,
        total: subtotal + shippingTotal,
        currency: "PKR",
        shippingName: index % 2 === 0 ? "[DEMO] Ayesha Khan" : "[DEMO] Hamza Siddiqui",
        shippingLine1: index % 2 === 0 ? "12 Gulberg III" : "44-C Khayaban-e-Shahbaz",
        shippingCity: index % 2 === 0 ? "Lahore" : "Karachi",
        shippingRegion: index % 2 === 0 ? "Punjab" : "Sindh",
        notes: "[DEMO] Seeded order for dashboard demonstration.",
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        events: {
          create: [
            {
              type: "created",
              message: "Order placed",
              actor: "system",
              createdAt,
            },
            {
              type: "status",
              message: `Status set to ${scenario.status}`,
              actor: "seed",
              createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
            },
          ],
        },
      },
    });

    if (scenario.status === "DELIVERED") {
      const first = picked[0]!;
      await db.review.deleteMany({ where: { productId: first.id, customerId } });
      await db.review.create({
        data: {
          productId: first.id,
          customerId,
          authorName: "[DEMO] Ayesha K.",
          rating: 5,
          title: "Exactly as described",
          body: "Arrived boxed and in the condition described. The dial reads darker in person than on screen, which I prefer. Sizing advice over WhatsApp was genuinely useful.",
          approved: true,
        },
      });
    }

    console.log(`  order ${order.orderNumber}: ${scenario.status}`);
  }
}

async function main() {
  console.log("\nSeeding Qalb Collections\n");

  await seedSettings();
  const { adminEmail, customerId } = await seedUsers();
  const { watches, perfumes } = await seedCategories();

  await seedAttributeDefinitions(watches.id, WATCH_ATTRIBUTES);
  await seedAttributeDefinitions(perfumes.id, PERFUME_ATTRIBUTES);
  console.log(
    `  attribute definitions: ${WATCH_ATTRIBUTES.length} watch · ${PERFUME_ATTRIBUTES.length} perfume`,
  );

  await seedCollections();
  await seedTags();

  await seedProducts(watches.id, WATCH_PRODUCTS);
  await seedProducts(perfumes.id, PERFUME_PRODUCTS);
  console.log(
    `  products: ${WATCH_PRODUCTS.length} watches · ${PERFUME_PRODUCTS.length} perfumes (coming soon)`,
  );

  await seedGlobalFaqs();
  await seedCms();
  await seedCoupon();
  await seedDemoOrders(customerId);

  console.log(`\nDone. Sign in to /admin as ${adminEmail}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
