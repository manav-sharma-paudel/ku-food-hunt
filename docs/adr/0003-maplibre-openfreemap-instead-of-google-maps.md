# ADR 0003 — MapLibre + OpenFreeMap instead of Google Maps JS

**Status:** Accepted · 2026-07-16 (Phase 5)

## Context

The original spec named the Google Maps JS API. Rendering Google's map requires a
Google Cloud project with **billing enabled** (a credit card on file) plus an API key and,
for custom styling, a Cloud Map ID. None of that was available at build time, and it can't be
created without the owner's account. The blueprint's open items pre-approved a fallback for
exactly this blocker; the owner confirmed the fallback for Phase 5.

## Decision

Use **`react-map-gl` (MapLibre entrypoint)** with **OpenFreeMap** vector tiles
(`https://tiles.openfreemap.org/styles/positron`).

- No API key, no billing, no credit card — fits the ~$0/month budget.
- Custom pins are ordinary React components (`RestaurantPin`), styled to the paprika theme.
- **Navigation still uses Google Maps deep links** (`googleMapsDirectionsUrl`) — the "Open in
  Google Maps / Directions" buttons need no key and open the native app. That's the actual
  conversion event, so the Google experience is preserved where it matters.
- `maplibre-gl` is heavy (~273 KB gzipped) but lives in its own lazy chunk loaded only on `/map`
  and on the detail Location section (via `React.lazy` + IntersectionObserver), so it never
  touches the initial bundle.

## Consequences

- The map works and is verifiable today, with no external setup.
- Map tiles stay light ("positron") even in dark mode; app chrome adapts. A dark tile style is a
  future enhancement (OpenFreeMap has no dark variant yet).
- Marker clustering was deferred — at ≤150 curated restaurants, DOM markers render fine without
  it. Revisit with `supercluster` if density grows.
- **Swap path to Google Maps** if billing is ever set up: replace `map-config.ts`'s style URL
  with a Cloud Map ID and swap the `react-map-gl/maplibre` import for `react-map-gl` (Google) —
  markers, preview cards, filters, and page logic are provider-agnostic and unchanged.
