# ADR 0002 — Vite SPA now, documented SSR migration path

**Status:** Accepted · 2026-07-16

## Context

The stack mandates React + Vite, which yields a client-rendered SPA. SEO matters for a discovery
product, but the primary growth channel at launch is on-campus word of mouth and shared links,
not organic search.

## Decision

Ship as a Vite SPA. Mitigate SEO in Phase 7 with:

- `react-helmet-async` meta/OG/Twitter tags per route,
- JSON-LD `Restaurant` structured data,
- build-time prerendering of public routes (`/`, category pages, restaurant pages),
- DB-generated `sitemap.xml` + `robots.txt`.

## Consequences

- Fastest possible iteration now; no server rendering complexity.
- If organic search becomes the primary acquisition channel, migrate `apps/web` to React Router
  v7 framework mode (SSR). Components, Tailwind, TanStack Query, and the API are unaffected —
  the blast radius is route/entry wiring only.
