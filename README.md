# Qalb Collections

A luxury e-commerce platform for premium watches (and upcoming perfumes), built for the Pakistani market. Narrow, considered inventory; editorial photography; honest descriptions.

## Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: Prisma ORM — SQLite for development, PostgreSQL for production
- **Auth**: Custom session-cookie auth (no third-party provider required)
- **Styling**: Tailwind CSS
- **Payments**: Cash-on-delivery and bank transfer out of the box; Stripe wiring is present but disabled until needed

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`. The defaults work for local development (SQLite, console analytics, COD/bank transfer payments). The one value you must change before going to production is `NEXT_PUBLIC_SITE_URL`.

### 3. Set up the database and seed initial data

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # apply schema to SQLite (dev only)
npm run db:seed       # creates admin user, sample products, site settings
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin panel is at `/admin`.

Default credentials (set in `.env`):

| Role     | Email                        | Password      |
| -------- | ---------------------------- | ------------- |
| Admin    | admin@qalbcollections.com    | ChangeMe!2026 |
| Customer | customer@example.com         | ChangeMe!2026 |

Change these before any public deployment.

## Available scripts

| Script              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Development server with hot reload                     |
| `npm run build`     | Production build (runs `prisma generate` first)        |
| `npm run start`     | Start the production server                            |
| `npm run lint`      | ESLint check                                           |
| `npm run typecheck` | TypeScript check without emitting                      |
| `npm run format`    | Prettier — format all source files                     |
| `npm run db:seed`   | Seed admin user, sample products and site settings     |
| `npm run db:reset`  | Wipe and re-migrate the database (dev only)            |

## Deployment

Before deploying:

1. Set `DATABASE_URL` to a PostgreSQL connection string and update `prisma/schema.prisma` to use `provider = "postgresql"`.
2. Run `npm run db:deploy` (not `db:push`) to apply migrations without destructive resets.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain (e.g. `https://qalbcollections.com`). This value is used for canonical URLs, the sitemap, Open Graph tags and JSON-LD — it must match the live origin exactly.
4. Generate a strong `AUTH_SECRET` with `openssl rand -base64 48`.
5. Set `PAYMENT_PROVIDERS` as needed.

## Project structure

```
src/
  app/
    (storefront)/   # Public-facing pages (home, shop, product, journal …)
    (checkout)/     # Minimal checkout shell (no nav, no cross-sell)
    admin/          # Admin panel — product, order, content management
    api/            # API route handlers
  components/       # UI components (layout, product, checkout, marketing …)
  lib/              # Shared utilities (auth, payments, SEO, money, settings …)
  server/           # Server-side data fetching and actions
prisma/
  schema.prisma     # Database schema
  seed.ts           # Initial data
```
