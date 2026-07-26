# KU Food Hunt 🍜

Food discovery for Kathmandu University — every restaurant, café, chiya pasal, bakery, and food
stall around KU, with real menus, NPR prices, honest student reviews, and one-tap Google Maps
navigation.

> Full product & technical spec: [docs/BLUEPRINT.md](docs/BLUEPRINT.md) ·
> Architecture decisions: [docs/adr/](docs/adr/)

## Stack

| Layer    | Tech                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Frontend | React · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Framer Motion |
| Backend  | Node.js · Express · TypeScript · Zod · Pino                                           |
| Database | PostgreSQL · Prisma                                                                   |
| Maps     | MapLibre GL + OpenFreeMap (free, no key) · Google Maps deep links for nav (ADR 0003)  |

## Getting started

Prerequisites: Node ≥ 20, pnpm ≥ 10 (`npm i -g pnpm`), PostgreSQL 17.

```sh
# one-time: local database
brew install postgresql@17 && brew services start postgresql@17
/opt/homebrew/opt/postgresql@17/bin/createdb ku_food_hunt

# one-time: env + install + schema + sample data
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL (local: postgresql://<mac-user>@localhost:5432/ku_food_hunt)
pnpm install
pnpm --filter @ku-food-hunt/api db:migrate
pnpm --filter @ku-food-hunt/api db:seed

pnpm dev        # web on :5173, api on :4000 (web proxies /api and /healthz to the api)
```

Useful: `pnpm --filter @ku-food-hunt/api db:studio` opens Prisma Studio to browse/edit data.

## Docker

Runs the whole stack — Postgres 17, the API, and nginx serving the built SPA — with no local
Node, pnpm, or Postgres install.

```sh
cp .env.example .env    # set POSTGRES_PASSWORD and REVIEW_HASH_SALT (openssl rand -hex 32)
docker compose up --build
docker compose run --rm migrate    # first run, and after any new migration
```

The site is then on <http://localhost:8080> — admin at `/admin`, partner form at `/partners`.

| File                                       | What it is                                            |
| ------------------------------------------ | ----------------------------------------------------- |
| [apps/api/Dockerfile](apps/api/Dockerfile) | Node 22 (Debian slim, for Prisma's OpenSSL) → `dist/` |
| [apps/web/Dockerfile](apps/web/Dockerfile) | Vite build → nginx, with SPA fallback + API proxy     |
| [apps/web/nginx.conf](apps/web/nginx.conf) | Same-origin `/api`, `/uploads`, `/sitemap.xml`; CSP   |
| [docker-compose.yml](docker-compose.yml)   | db + api + web, plus an opt-in `migrate` service      |

Worth knowing before changing any of it:

- **Build context is the repo root** for both images, not the app directory — both depend on the
  `@ku-food-hunt/shared` workspace package, so pnpm needs the workspace manifest and lockfile.
- **`VITE_*` variables are build args, not runtime env.** Vite inlines them into the bundle, so
  changing `SITE_URL` means `docker compose build web`, not a restart.
- **Migrations are opt-in** (`docker compose run --rm migrate` runs `prisma migrate deploy`, which
  is additive and safe to re-run). There is deliberately no seed service: `prisma/seed.ts` opens
  with unconditional `deleteMany()` calls across `Restaurant`, `Category` and `SiteSetting`, and
  rewrites the admin password to the dev default unless `ADMIN_SEED_PASSWORD` is set. Its only
  guard is a `NODE_ENV === 'production'` check, which cannot fire in this container because the
  seed never loads dotenv.
- **The API port is not published.** Traffic reaches it only through nginx, which keeps it exactly
  one proxy hop from the client — what the app's `trust proxy: 1` assumes. Publishing it creates a
  second path where `req.ip` resolves to the Docker bridge gateway instead of the caller, and every
  rate limit silently collapses into one shared bucket.
- **Uploaded photos live on the `uploads` volume.** The API writes to `process.cwd()/uploads`, so
  the image's `WORKDIR` and that volume mount have to stay in step.

## Workspace layout

```
apps/web          React SPA (Vite)
apps/api          Express API
packages/shared   Zod schemas, types, constants, utils shared by both
docs/             Blueprint, ADRs
```

`packages/shared` is an internal package: it exports TypeScript source directly and is compiled
by each consumer (Vite / tsx / tsup) — no separate build-watch step needed.

## Scripts (repo root)

| Script           | What it does                          |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Run api + web dev servers in parallel |
| `pnpm build`     | Build all packages                    |
| `pnpm typecheck` | `tsc --noEmit` across the workspace   |
| `pnpm test`      | Run tests (Vitest)                    |
| `pnpm lint`      | ESLint across the workspace           |
| `pnpm format`    | Prettier write                        |

## Roadmap status

- [x] Phase 0 — Foundations (monorepo, toolchain, CI, API + web skeletons)
- [x] Phase 1 — Data model & API core (Prisma schema, migration, seed, public read endpoints)
- [x] Phase 2 — Design system & app shell (tokens + dark mode, UI primitives, nav/footer, router, TanStack Query)
- [x] Phase 3 — Explore (URL-driven filters/sort, RestaurantCard + QuickView, search overlay + `/search/suggest`, client-side distance)
- [x] Phase 4 — Restaurant detail (header, gallery + lightbox, menu, reviews display, hours, location, nearby, sticky mobile actions)
- [x] Phase 5 — Map (MapLibre + OpenFreeMap, custom pins, list panel, filters, locate-me, preview cards, real detail mini-map)
- [x] Phase 6 — Reviews (anonymous submission form with star input + photo upload, honeypot + rate-limit + Turnstile-ready anti-spam, transactional rating aggregates, helpful-vote toggle)
- [x] Phase 7 — Landing, SEO & performance (full landing + About, React 19 per-route meta/OG/Twitter + Restaurant/WebSite/Breadcrumb JSON-LD, dynamic sitemap, robots + manifest + favicon, preconnect + shimmer placeholders)
- [x] Phase 8 — Admin dashboard (`/admin`: scrypt + session-cookie + CSRF auth, tabbed restaurant editor with map location picker / hours / menu builder / photo manager, review moderation, homepage & featured manager, audit log)
- [x] **Phase 9 — Hardening & launch** (helmet HSTS + security headers, `<script>`-safe JSON-LD, **WCAG 2.1 AA** verified via axe in light/dark/admin, global reduced-motion, privacy-first opt-in analytics; operational runbook in [docs/LAUNCH.md](docs/LAUNCH.md))
- [x] **Partner onboarding** (`/partners`, deployable as `partners.<domain>`): public restaurant submission form → lands as **Pending** in the admin → approve publishes it / reject emails the owner a reason + a signed edit-and-resubmit link that updates the same record. Env-gated Resend email; anti-spam per ADR 0004. See [ADR 0006](docs/adr/0006-partner-onboarding.md).

### Admin console

Sign in at [`/admin`](http://localhost:5173/admin). Dev credentials (seeded): **`admin@kufoodhunt.app`** / **`kufoodhunt-dev`** — override with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` before `db:seed`.

### Partner onboarding

Restaurant owners submit their place at [`/partners`](http://localhost:5173/partners) (no login).
Submissions appear under **Admin → Restaurants → Pending**; approving publishes them, rejecting
requires a reason that is emailed to the owner with an edit-and-resubmit link. In dev (no
`RESEND_API_KEY`) those emails — including the edit link — are printed in the API console.
New env vars (`RESEND_API_KEY`, `MAIL_FROM`, `PARTNERS_URL`) are documented in
[apps/api/.env.example](apps/api/.env.example); subdomain DNS setup is in
[docs/LAUNCH.md](docs/LAUNCH.md).
