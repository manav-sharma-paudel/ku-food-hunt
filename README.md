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

> ⚠️ **`db:seed` is destructive and for local/dev use only.** It resets sample data and dev
> credentials. Never run it against a database that holds real production data. See internal
> ops documentation for details.

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
- **Migrations are opt-in and additive** (`docker compose run --rm migrate` runs
  `prisma migrate deploy`, safe to re-run). **There is deliberately no seed service in this
  compose file** — seeding is a local-only workflow, not part of the deployed stack.
- **The API port is intentionally not published.** Traffic reaches it only through nginx. Keep
  it that way — exposing it directly changes how the app sees client IPs and undermines its
  abuse-prevention safeguards. Details in internal ops docs, not here.
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

Sign in at `/admin`. Credentials are configured via `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`
in your environment before running `db:seed` — set these to strong, unique values for any
non-local environment. Do not rely on defaults.

### Partner onboarding

Restaurant owners submit their place at `/partners` (no login required). Submissions appear
under **Admin → Restaurants → Pending**; approving publishes them, rejecting requires a reason
that is emailed to the owner with an edit-and-resubmit link. In local dev (no
`RESEND_API_KEY` set), those emails — including the edit link — are printed to the API console
instead of sent. New env vars (`RESEND_API_KEY`, `MAIL_FROM`, `PARTNERS_URL`) are documented in
`apps/api/.env.example`; subdomain DNS setup is in `docs/LAUNCH.md`.

## Security

If you believe you've found a security issue, please report it privately rather than opening a
public GitHub issue. (Add your preferred contact method or a `SECURITY.md` link here.)
