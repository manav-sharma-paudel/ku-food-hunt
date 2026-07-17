# KU Food Hunt — Product & Technical Blueprint

**Status:** Approved 2026-07-16 · **Owner:** Manav Paudel · **All 9 phases complete — launch-ready** (operational go-live steps in `docs/LAUNCH.md`). Map uses MapLibre + OpenFreeMap (no Google key needed) — see ADR 0003. Reviews ship with an anonymous submission flow, local photo uploads, and a Turnstile-ready anti-spam stack — see ADR 0004. SEO uses React 19 native per-route metadata + JSON-LD, with a dynamic `/sitemap.xml`; true prerendering/SSR remains the deferred item in ADR 0002. Admin auth uses scrypt + DB-backed session cookies + CSRF (no argon2 native build) — see ADR 0005; dev login is `admin@kufoodhunt.com` / `kufoodhunt-dev`. Phase 9 hardening: helmet HSTS + security headers, `<script>`-safe JSON-LD, **WCAG 2.1 AA verified (axe, light + dark + admin)** — `primary-strong`/`basil` deepened for AA — global reduced-motion, and privacy-first (cookieless, DNT-respecting, opt-in) analytics.

Architectural summary: pnpm monorepo (`web` + `api` + shared types package) · REST API with
Zod-validated contracts shared end-to-end · PostgreSQL with Prisma and Postgres-native fuzzy
search · Cloudinary for images · anonymous reviews protected by rate-limiting + Turnstile + admin
moderation · distance computed client-side, "Open Now" computed in Asia/Kathmandu time · admin
panel as a lazy-loaded route in the same SPA · deploy as Vercel (web) + Railway/Render (API) +
Neon (Postgres).

---

## 1. Product Vision

**One-liner:** The definitive answer to "khaana khaana kahaa jaane?" for every KU student in
Dhulikhel.

**What it is:** A curated, trustworthy food-discovery platform covering every restaurant, café,
chiya pasal, bakery, and food stall around Kathmandu University — with real menus, real NPR
prices, honest student reviews, and one-tap Google Maps navigation.

**What it deliberately is not (v1):** not a delivery app, not a booking system, not a
Nepal-wide directory. Focus is the moat.

**Why it can win:**

- The data doesn't exist anywhere else. Google Maps has pins but no menus/prices for small
  Dhulikhel eateries; that curated data _is_ the product.
- Zero-friction: no login, loads fast on campus Wi-Fi and mobile data.
- Curation over crowdsourcing: admin-managed listings keep information accurate and spam-free —
  trust is the brand.

**Success metrics:** weekly active users among KU's ~10k students, % of restaurant pages with
complete menus, reviews submitted per week, "Open in Google Maps" taps (the conversion event),
return-visit rate.

**Scale reality (drives every technical decision):** roughly 50–150 restaurants, hundreds of menu
items, thousands of reviews over time, hundreds–low-thousands of daily users. Small data, high
content-quality requirements — optimize for correctness, polish, and maintainability, not
distributed-systems machinery.

**The real project risk:** the hardest work is not code — it's collecting and maintaining photos,
menus, prices, and hours for ~100 eateries on the ground. The architecture accounts for this:
listings can launch with just a photo of the physical menu (a "menu scan") before items are
transcribed, so data entry never blocks launch.

## 2. User Experience

**Personas:**

1. **The new first-year** — just moved to Dhulikhel. Needs: browse by category, see photos and
   prices before walking in, navigate there.
2. **The budget regular** — eats out daily on a tight allowance. Needs: price filters, "cheapest"
   sort, QR payment info (eSewa/Khalti/FonePay — nobody carries cash).
3. **The group organizer** — planning a birthday/farewell. Needs: capacity clues from photos,
   ratings, phone number to call ahead, shareable links.
4. **The visiting parent / faculty** — wants "the good places." Needs: featured picks,
   highest-rated sort.

**Core jobs-to-be-done:**

- "Show me what's open _right now_ near me" → Open Now filter + distance, computed in Nepal time
  (UTC+5:45).
- "Where can I get momo under Rs. 200?" → dish-level search + price filter.
- "Is this place any good?" → student reviews with photos.
- "Take me there" → one tap opens Google Maps navigation.

**UX principles:**

- **Three taps to navigation:** landing → restaurant → "Open in Google Maps." Never more.
- **No account walls, ever.** Even reviews are anonymous-friendly.
- **Fast on bad networks:** skeleton-first rendering, optimized images, small JS bundles.
- **Price honesty:** NPR everywhere, in student bands: Budget (under Rs. 200) / Standard
  (Rs. 200–500) / Premium (Rs. 500+).
- **URL is state:** every filtered view is shareable — link-sharing in group chats is the growth
  loop.

## 3. Information Architecture

```
KU Food Hunt
├── Restaurants (the core entity)
│   ├── Identity: name, slug, description, categories, badges (QR/delivery/veg)
│   ├── Location: address, coordinates, distance (computed), Google Place ID
│   ├── Media: cover, gallery, menu scans
│   ├── Menu: menu categories → menu items (name, price, veg flag, popular flag)
│   ├── Operations: opening hours (per weekday, split shifts), phone, price band
│   └── Social proof: reviews (rating, text, photos, helpful votes), cached avg rating
├── Categories (Momo, Thakali, Café, Bakery, Chiya, Fast Food, Sekuwa, Dessert, …)
├── Editorial (admin-managed): featured restaurants, homepage sections, FAQ, testimonials
└── Admin (private): CRUD everything, moderation, settings
```

**Navigation model:** three primary destinations — **Home** (editorial discovery), **Explore**
(search/browse/filter), **Map** (spatial discovery). Restaurant detail is the convergence point.
Search is globally accessible from the navbar.

**Relationships:** Restaurant ↔ Category is many-to-many. Restaurant → MenuCategory → MenuItem is
a strict hierarchy. Reviews and images hang off restaurants; review photos hang off reviews.

## 4. Complete Sitemap

**Public**

| Route                | Page                                          |
| -------------------- | --------------------------------------------- |
| `/`                  | Landing page                                  |
| `/explore`           | Listing with search, filters, sorting         |
| `/restaurants/:slug` | Restaurant detail                             |
| `/map`               | Full-screen interactive map                   |
| `/categories/:slug`  | Explore pre-filtered by category (SEO)        |
| `/about`             | About + contact                               |
| `/404`               | Custom not-found with search + popular places |

**Admin (lazy-loaded chunk, behind auth)**

| Route                                              | Page                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `/admin/login`                                     | Sign-in                                                          |
| `/admin`                                           | Dashboard overview                                               |
| `/admin/restaurants`                               | Restaurant table                                                 |
| `/admin/restaurants/new`, `/admin/restaurants/:id` | Editor (tabs: Basics · Location · Hours · Menu · Photos · Flags) |
| `/admin/reviews`                                   | Moderation queue                                                 |
| `/admin/homepage`                                  | Featured ordering + homepage sections + FAQ/testimonials         |
| `/admin/settings`                                  | Site settings, admin accounts                                    |

**Machine routes:** `/sitemap.xml` (DB-generated), `/robots.txt` (blocks `/admin`).

URL conventions: permanent kebab-case slugs; all Explore state in query params
(`/explore?q=momo&price=budget&open=true&sort=closest`).

## 5. User Flows

**1 — Discovery to navigation (golden path):** land on `/` → tap a featured card → detail page
(location permission requested only when distance is first needed) → scan rating/menu/hours → tap
**Open in Google Maps** → deep link
`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&destination_place_id={placeId}`
opens the Google Maps app (browser fallback is automatic).

**2 — Craving-driven search:** search overlay (recent searches from localStorage + curated
popular searches) → debounced autocomplete grouped as Restaurants / Dishes / Categories →
selecting a dish lands on that restaurant with the menu in view; Enter goes to Explore with `q=`.

**3 — Review submission (no account):** detail page → "Write a Review" → sheet/dialog → star
rating (required), text (20–1000 chars), optional name (default "KU Student"), up to 3 photos.
Invisible protections: Cloudflare Turnstile, honeypot, minimum-time check, IP-hash rate limits
(1/restaurant/day, 3/day total). Publishes immediately; admins can hide later; optimistic UI.

**4 — Helpful vote:** optimistic increment; deduplicated by localStorage flag + hashed-IP unique
constraint.

**5 — Map exploration:** markers cluster at low zoom → tap marker → preview card → "View Details"
or "Open in Google Maps."

**6 — Admin adds a restaurant:** login → New Restaurant → Basics → drop a pin (or paste a Google
Maps link, coordinates parsed) → hours with "copy Monday to all days" → direct-to-Cloudinary photo
upload → menu items now _or_ menu-scan photos → Save as Draft → Publish.

## 6. Wireframes

### Landing (`/`)

- **Navbar** (sticky, translucent blur): logo left, Explore · Map · About center, pill search
  right. Mobile: logo + search icon + hamburger.
- **Hero** (~85vh): full-bleed warm food photo (momo, chiya) under subtle dark gradient. Headline
  **"Every great bite around KU."** Subhead + large search bar ("Search momo, cafés, thakali…").
  Buttons: primary "Explore Restaurants," ghost "View Map." Trust line: "120+ places · 800+
  student reviews."
- **Featured Restaurants:** horizontal snap carousel of large cards (admin-ordered).
- **Browse by Category:** tappable tiles (icon + name + count), 4/row desktop, 2 mobile.
- **Popular Near KU:** card grid (top-rated within ~1km).
- **Map Preview:** styled static snapshot with "Open Full Map" overlay (no Maps JS loaded here).
- **Recently Added:** compact row with "New" badges.
- **Student Favorite Picks:** editorial cards with quote blurbs.
- **Why KU Food Hunt:** three columns — Real menus & prices · Honest reviews · One-tap navigation.
- **Testimonials**, **FAQ accordion**, **CTA band**, **Footer** (dark warm charcoal, link columns,
  "Suggest a restaurant" mailto, "Made by KU students 🍜").

### Explore (`/explore`)

- **Desktop:** sticky left rail (280px) — price checkboxes, min rating, distance slider, toggles
  (Open Now / Delivery / QR / Veg), categories, "Clear all." Right: result count, sort dropdown,
  card grid (3/2/1 cols), "Load more."
- **Mobile:** sticky bar with search + scrolling filter chips + "Filters" chip (badge with active
  count) opening a bottom sheet with sticky "Show N results" button.
- **Card:** 16:10 cover (lazy, blur-up), Open/Closed badge, heart (disabled, "coming soon"), name,
  stars + count, category · price band, distance chip. Hover: lift 4px, image scale 1.03, "Quick
  View" pill → summary dialog. Whole card is one link; quick-view is a button inside (no nested
  links).
- **Empty state:** line-art empty steamer, "Nothing matches those filters," clear-filters button.

### Restaurant detail (`/restaurants/:slug`)

- Cover (~45vh) with back button; overlapping surface card: H1, stars + count, category badges,
  price band, "Open · closes 9 PM," distance. Actions: **Open in Google Maps**, **Call**,
  **Share** (Web Share API, copy fallback).
- Gallery strip + "+N photos" → full-screen lightbox (keyboard + swipe).
- Sticky scroll-spy tabs: Overview · Menu · Reviews · Location.
- **Overview:** description; info grid (address, phone, hours accordion with today highlighted,
  amenity badges).
- **Popular Dishes:** horizontal dish cards.
- **Menu:** category pill tabs; item rows (name/description left, price right, optional thumb, veg
  leaf, unavailable dimmed). Menu-scan fallback: zoomable images + "full menu coming soon."
- **Reviews:** summary (big average + distribution bars), sort, review cards (initial avatar, name
  or "KU Student", stars, date, clamped text, photo thumbs, Helpful button). "Write a Review"
  button. All review photos also aggregate into a Student Photos strip.
- **Location:** lazy-loaded Google Map embed, address, "Open in Google Maps" again.
- **Nearby:** 4-card row (same category or within 500m).
- **Mobile:** sticky bottom action bar (Open in Maps + Call) after scrolling past header.

### Map (`/map`)

Full-viewport map, custom warm styling via Cloud Map ID. Custom pins (category icon in paprika
circle), clustered below zoom 15. Floating search-this-area + filter chips. Locate-me FAB.
Marker tap → mobile bottom preview card (swipe-dismiss) / desktop anchored card. Desktop:
collapsible list panel synced with viewport. Permission denied → center on KU gate + dismissible
note.

### Mobile navigation

Bottom tab bar (Home · Explore · Map · Search), hidden on scroll-down, 56px + safe-area inset,
active tab in primary with subtle spring. Hamburger holds secondary links.

### Admin (Phase 8)

Neutral dense sidebar layout. Tabbed restaurant editor with per-tab save + Draft/Published toggle;
menu builder with drag-reorder, inline price edit, availability switches; photo manager with
drag-drop upload, reorder, "set as cover," required alt text; hours editor with split shifts +
"copy to all." Moderation queue with one-click Hide + undo toast. Destructive actions confirm;
deletes are soft.

## 7. Design System

**Personality:** Apple restraint (whitespace, few borders, blur, tight type) warmed by food —
cream surfaces, paprika accents, honey stars. Photography carries color; UI stays calm.

**Color tokens (light / dark):**

| Token            | Light             | Dark      | Use                       |
| ---------------- | ----------------- | --------- | ------------------------- |
| `background`     | `#FAF8F5`         | `#141210` | page                      |
| `surface`        | `#FFFFFF`         | `#1D1A17` | cards, sheets             |
| `primary`        | `#E85D2C` paprika | `#F0713F` | CTAs, active nav          |
| `primary-strong` | `#C4491E`         | —         | small links, pressed (AA) |
| `accent`         | `#F2A93B` honey   | `#F2B04D` | star ratings only         |
| `success`        | `#2F7A4D` basil   | `#4FA871` | Open badge, veg leaf      |
| `danger`         | `#C0392B`         | `#E06052` | Closed, errors            |
| `text`           | `#221D1A`         | `#F2EEE9` | primary text              |
| `text-muted`     | `#6E655E`         | `#A69C93` | secondary text            |
| `border`         | `#EAE4DC`         | `#2C2824` | hairlines                 |

Full 50–900 ramps; AA contrast enforced (small links use `primary-strong`). CSS variables consumed
by Tailwind; dark mode via `dark` class on `<html>`, `prefers-color-scheme` default + persisted
manual toggle — architected day one even if the toggle ships later.

**Typography:** Inter Variable (self-hosted, subset, swap) with Noto Sans Devanagari fallback.
Headings semibold, −0.02em tracking. Scale 12/14/16/18/20/24/30/36/48–60. Prices `tabular-nums`.

**Shape & depth:** radii — inputs/buttons 10px, cards 16px, sheets 20px, chips pill. Hairline
borders + soft layered shadows; hover elevates one step. No hard shadows.

**Spacing:** 4px base; card padding 16/20; sections 64px mobile / 96px desktop; max-width 1200px.

**Buttons:** Primary (paprika, white text, press-scale 0.98), Secondary (surface + border), Ghost,
Destructive (admin). Heights 44/52px; touch targets ≥44px.

**Icons:** Lucide, 1.5px stroke, 20px UI / 24px nav.

**Motion (Framer Motion):** micro 150–250ms ease-out; page transitions 200ms fade + 8px rise;
sheets on gentle springs (stiffness ~300, damping ~30); 40ms stagger on first card-grid load.
`useReducedMotion` respected globally.

**Skeletons:** shimmer matching exact component geometry; spinners only for button-level actions.

**Empty/error states:** single-color food line-art (empty steamer, spilled chiya for errors) + one
human sentence + one recovery action (Retry via Query refetch).

**Imagery:** fixed aspect-ratio containers (16:10 cards, 4:3 gallery) with blur-up placeholders —
zero layout shift.

## 8. UI/UX Decisions

1. Bottom tab bar on mobile — Home/Explore/Map deserve thumb-level access.
2. **Filters live in the URL** — shareable, back-button-friendly; Query keys derive from
   searchParams. The most important frontend architecture decision.
3. Distance computed client-side (Haversine) — user coordinates never sent to the server.
4. "Open Now" computed explicitly in `Asia/Kathmandu` (UTC+5:45, no DST).
5. Reviews publish instantly, moderate after — pending queues kill contribution momentum.
6. Quick View as dialog/sheet, not hover popover — identical for touch and mouse.
7. Google Maps JS loads only on `/map` and the detail location section (IntersectionObserver).
8. Menu scans are first-class — a listing is live day one with photos of the physical menu.
9. shadcn/ui (Radix) for all overlays/inputs — accessibility comes solved; we skin, not rebuild.
10. Heart icon ships visually disabled — advertises the roadmap without building auth.

**Accessibility:** semantic landmarks + skip link; full keyboard operability with visible
focus-visible rings; star input as radio group; `aria-live` result announcements; required alt
text (enforced in admin uploader); errors via `aria-describedby`; AA contrast by token design;
≥44px targets; reduced motion respected.

## 9. Database Planning

UUIDs everywhere; `createdAt`/`updatedAt` on all tables; soft deletes (`deletedAt`) on content.

- **restaurants** — `slug (unique), name, description, address, latitude, longitude,
googlePlaceId?, phone?, priceBand (BUDGET|STANDARD|PREMIUM), priceMinNpr?, priceMaxNpr?,
hasQrPayment, hasDelivery, hasVegOptions, status (DRAFT|PUBLISHED|ARCHIVED), isFeatured,
featuredRank?, avgRating (cached), reviewCount (cached), coverImageId?`. Indexes: slug, status,
  (isFeatured, featuredRank), pg_trgm on name. Cached aggregates updated in the same transaction
  as review writes.
- **categories** — `slug, name, icon, sortOrder`; **restaurant_categories** join (composite PK).
- **opening_hours** — `restaurantId, dayOfWeek (0–6), opensAt, closesAt (minutes from midnight,
  > 1440 = past midnight), note?`. Multiple rows/day = split shifts; no rows = closed.
- **restaurant_images** — `cloudinaryPublicId, url, alt, type (COVER|GALLERY|MENU_SCAN),
sortOrder, width, height`.
- **menu_categories** — `restaurantId, name, sortOrder`.
- **menu_items** — `menuCategoryId, restaurantId (denormalized for dish search), name,
description?, priceNpr, imageId?, isAvailable, isPopular, isVegetarian, sortOrder`. pg_trgm on
  name — powers food-item search.
- **reviews** — `restaurantId, authorName?, rating (1–5), body, status
(PUBLISHED|HIDDEN|FLAGGED), helpfulCount (cached), ipHash, userAgentHash`. Index
  (restaurantId, status, createdAt). Salted IP hashes only — no raw PII.
- **review_images**; **review_votes** — `reviewId, voterHash` with UNIQUE(reviewId, voterHash).
- **admins** — `email, passwordHash (argon2id), name, role (SUPERADMIN|EDITOR), lastLoginAt`.
- **site_settings** — key + JSONB value: hero_content, popular_searches, faq, testimonials,
  homepage_sections. (Featured lives on the restaurant row itself.)
- **audit_logs** — `adminId, action, entityType, entityId, diff (JSONB)`.
- **search_logs** (optional, later) — real popular-search data.

**Search strategy:** pg_trgm similarity across restaurant/menu-item/category names for
autocomplete and fuzzy search — single-digit ms at this scale; Elasticsearch would be pure
overhead. Upgrade path: generated tsvector column.

## 10. Folder Structure

```
ku-food-hunt/
├── package.json / pnpm-workspace.yaml
├── .github/workflows/ci.yml
├── docs/                              # blueprint, ADRs, runbook
├── packages/shared/src/
│   ├── schemas/                       # Zod: restaurant, review, filters, admin inputs
│   ├── types/                         # z.infer exports
│   ├── constants/                     # categories, price bands, sort options, KU coordinates
│   └── utils/                         # isOpenNow, haversine, slugify, formatNpr
├── apps/api/
│   ├── prisma/                        # schema.prisma, migrations/, seed.ts
│   └── src/
│       ├── app.ts / index.ts
│       ├── config/                    # zod-validated env
│       ├── middleware/                # auth, rateLimit, validate, errorHandler
│       ├── modules/                   # restaurants/ reviews/ search/ categories/ home/
│       │                              # uploads/ admin/ seo/  (routes + service + repo each)
│       ├── lib/                       # prisma, cloudinary, hashing, logger
│       └── tests/
└── apps/web/src/
    ├── api/                           # typed fetch client + Query hooks per domain
    ├── components/                    # ui/ layout/ restaurant/ review/ search/ map/ feedback/
    ├── pages/                         # Landing/ Explore/ RestaurantDetail/ Map/ About/ admin/
    ├── hooks/                         # useGeolocation, useOpenNow, useRecentSearches, useTheme
    ├── lib/                           # cn, analytics, seo helpers, gmaps loader
    ├── styles/                        # globals.css (design tokens)
    └── assets/
```

## 11. Component List

- **Layout:** Navbar, MobileBottomNav, MobileMenuSheet, Footer, PageShell, Section, Breadcrumb,
  ThemeToggle, SkipLink.
- **Restaurant:** RestaurantCard, RestaurantCardCompact, FeaturedCarousel, QuickViewDialog,
  RestaurantHeader, RestaurantGallery, ImageLightbox, OpeningHoursAccordion, OpenStatusBadge,
  PriceBadge, CategoryBadge, AmenityBadges, DistanceIndicator, NearbyRestaurants, ShareButton,
  CallButton, OpenInMapsButton, StickyActionBar.
- **Menu:** MenuSection, MenuCategoryTabs, MenuItemRow, PopularDishCard, MenuScanViewer.
- **Reviews:** ReviewSummary, RatingStars, RatingInput, ReviewCard, ReviewList, ReviewFormSheet,
  ReviewImageUploader, HelpfulButton, StudentPhotoStrip.
- **Search:** SearchBar, SearchOverlay, AutocompletePanel, RecentSearches, PopularSearches,
  FilterSidebar, FilterSheet, FilterChipRow, SortSelect, ActiveFilterPills, ResultCount.
- **Map:** MapView, RestaurantMarker, MarkerCluster, MarkerPreviewCard, LocateMeButton,
  MapFilterBar, MapListPanel, StaticMapPreview.
- **Feedback/primitives:** Skeleton variants, EmptyState, ErrorState, Spinner, Toast,
  ConfirmDialog, Pagination/LoadMore, Badge, Chip, SmartImage, themed shadcn primitives.
- **Admin:** AdminShell, AdminSidebar, DataTable, RestaurantEditorTabs, LocationPicker,
  HoursEditor, MenuBuilder, ImageUploadManager, ReviewModerationRow, FeaturedOrderEditor,
  SettingsForm, AuditLogList.

## 12. API Planning

REST under `/api/v1`; responses `{ data, meta? }`; errors `{ error: { code, message, details? } }`
with stable codes. Every input validated by shared Zod schemas — the contract cannot drift.
Offset pagination. Public GETs: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

**Public:**

| Endpoint                          | Purpose                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET /restaurants`                | Filters: q, categories, price, minRating, open, delivery, qr, veg, sort, page. Card payloads incl. coordinates + today's hours. |
| `GET /restaurants/:slug`          | Full detail — one request renders the page.                                                                                     |
| `GET /restaurants/:slug/reviews`  | Paginated; sort recent/top/helpful.                                                                                             |
| `POST /restaurants/:slug/reviews` | Anonymous; Turnstile verified; rate-limited.                                                                                    |
| `POST /reviews/:id/helpful`       | Idempotent per voterHash.                                                                                                       |
| `GET /categories`                 | Taxonomy with counts.                                                                                                           |
| `GET /search/suggest?q=`          | Grouped autocomplete, trigram-backed, ≤8 results.                                                                               |
| `GET /home`                       | Aggregated landing payload — one request.                                                                                       |
| `GET /map/restaurants`            | Lightweight all-markers payload (~15KB gzipped).                                                                                |
| `GET /sitemap.xml`, `/robots.txt` | Generated from DB.                                                                                                              |

**Admin (session cookie + CSRF):** auth login/logout/me; full restaurant CRUD incl. nested hours,
menu, images with reorder; `POST /admin/uploads/sign` (browser→Cloudinary direct upload);
review moderation (list by status, hide/restore, delete); settings PATCH; featured bulk rank;
audit logs.

**Cross-cutting:** helmet, strict CORS, global rate limit (300 req/15min/IP) + tight write
limits, pino structured logs with request IDs, `/healthz`.

## 13. Future Scalability

- **Accounts:** `users` table; `reviews.userId?` + `favorites` join slot in additively (review
  identity is already a nullable field, not a hard-coded string).
- **Owner portal:** `restaurant_owners` link table + PENDING_REVIEW content state; moderation
  pattern generalizes.
- **Ordering/offers/events:** new API modules + tables referencing restaurants.
- **AI recommendations:** pgvector column (no new infra) over the structured menu/review corpus.
- **PWA:** Vite PWA plugin; API shape already suits offline caching of visited pages.
- **Performance ceiling:** CDN-cached GETs + indexed Postgres serves 100× KU's population.
  Upgrade order when needed: Redis for /home + suggest → read replica → dedicated search.
- **Known stack risk:** SPA = no SSR. Mitigations in Phase 7; migration path is React Router v7
  framework mode (see ADR 0002).

## 14. Security

- **Admin auth:** argon2id; httpOnly/Secure/SameSite=Lax session cookie (not localStorage JWT);
  CSRF tokens on mutations; login rate-limited with backoff; server-side role checks.
- **Input safety:** Zod on every endpoint; Prisma parameterization; review text rendered as plain
  React text — no `dangerouslySetInnerHTML` anywhere, by policy.
- **Anonymous-write abuse:** Turnstile + honeypot + timing + salted-IP rate limits + unique vote
  constraint + admin flagging. No raw IPs stored.
- **Uploads:** signed direct-to-Cloudinary constraining folder/size (≤5MB)/format; Cloudinary
  re-encodes (strips EXIF GPS — protects reviewer location privacy); public uploads land in a
  quarantine folder surfaced in moderation.
- **Maps key:** HTTP-referrer-restricted, API-restricted to Maps JS, billing cap + alerts.
- **Transport:** HTTPS + HSTS, helmet + strict CSP (self + Cloudinary + Google Maps), strict CORS.
- **Operational:** env vars zod-validated at boot; deps audited in CI; daily Postgres backups with
  tested restore; soft deletes + audit log; Cloudflare in front of the domain.

## 15. Development Roadmap

| Phase                         | Scope                                                                                                                | Complexity  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------- |
| **0 — Foundations**           | Monorepo, TS strict, ESLint/Prettier, shared package skeleton, CI, env validation, deploy targets, hello-world       | Low         |
| **1 — Data & API core**       | Prisma schema + migrations, seed with ~10 real restaurants, public read endpoints, error/log/cache middleware        | Medium      |
| **2 — Design system & shell** | Tokens (light+dark), themed shadcn primitives, Navbar/Footer/BottomNav, router + Query, skeletons, SmartImage        | Medium      |
| **3 — Explore**               | Listing, RestaurantCard + QuickView, URL-driven filters/sort, FilterSidebar/Sheet, search overlay + suggest endpoint | Medium-High |
| **4 — Restaurant detail**     | Header, gallery + lightbox, hours, menu + scans, popular dishes, nearby, share/call/maps, sticky mobile bar          | Medium      |
| **5 — Map**                   | Clustered custom markers, preview cards, locate-me, filter bar, lazy Maps JS, deep links                             | Medium-High |
| **6 — Reviews**               | Form + photo upload, Turnstile + rate-limit stack, list + distribution, helpful votes, cached aggregates             | Medium      |
| **7 — Landing + SEO + perf**  | Full landing, helmet meta/OG, JSON-LD, prerendered public routes, sitemap/robots, Lighthouse ≥90 mobile              | Medium      |
| **8 — Admin dashboard**       | Auth + sessions, tabbed editor (location picker, hours, menu builder, images), moderation, homepage manager          | High        |
| **9 — Hardening & launch**    | Security pass, a11y audit, full data entry, domain + Cloudflare, analytics, pilot → public launch                    | Medium      |

Per-phase challenges are tracked in the phase notes as work begins. Notable: opening-hours
modeling incl. past-midnight closing (P1); on-the-ground data collection starts immediately — it
is the launch long pole (P1→P9); Maps billing setup + key restriction (P5); anti-spam tuning
(P6); prerendering a Vite SPA correctly (P7); menu-builder UX speed (P8).

## Open items (owner decisions)

1. **Google Maps billing** — needs a Google Cloud account with a card (free monthly credit covers
   expected usage). Fallback documented: MapLibre + OSM tiles; deep-link navigation works
   regardless.
2. **Hosting budget** — designed for ~$0–5/month free tiers (Vercel + Neon + Railway/Render +
   Cloudinary).
3. **Language** — v1 English-only with Devanagari font support for names; full Nepali i18n is a
   future feature.
4. **Data collection ownership** — who physically collects menus/photos/hours; gates launch more
   than any code.
