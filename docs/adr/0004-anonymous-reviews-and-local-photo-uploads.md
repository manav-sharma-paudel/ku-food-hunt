# ADR 0004 — Anonymous reviews, local photo uploads, layered anti-spam

**Status:** Accepted · 2026-07-16 (Phase 6)

## Context

The product has **no user accounts** — anyone browses freely and reviews anonymously. That makes
review submission the app's only unauthenticated write path, so it needs abuse resistance without
a login to lean on. Two external services named in the spec — Cloudflare Turnstile and Cloudinary
— require accounts/keys that aren't available at build time (same constraint as Google Maps in
ADR 0003).

## Decision

**Anonymous submission with a layered, degradable anti-spam stack:**

1. **Honeypot** — a visually-hidden `website` field. Real users never fill it; bots that auto-fill
   every input trip the `z.string().max(0)` guard and get a 400.
2. **Write rate limiter** — a dedicated `express-rate-limit` bucket (12 submissions/hour/IP, plus
   a looser 120/hour bucket for helpful-vote toggles), far tighter than the global read limiter.
3. **Salted fingerprints** — the raw IP and User-Agent are **never stored**; only one-way salted
   SHA-256 hashes (`REVIEW_HASH_SALT`) are, used for abuse signals and to make helpful votes
   one-per-person via a DB unique constraint.
4. **Turnstile, env-gated** — `verifyTurnstile()` is a no-op that returns `true` when
   `TURNSTILE_SECRET` is unset (dev), and enforces a real challenge when it (and the client site
   key) are configured in production. No code change needed to turn it on.

**Photo uploads land on local disk as a Cloudinary stand-in.** `multer` writes validated images
(JPEG/PNG/WebP, ≤4 MB) to `apps/api/uploads/reviews/<uuid>.<ext>`, served by `express.static`.
The stored URL shape (`/uploads/reviews/…`) is exactly what the review schema's allowlist regex
accepts, so submitted URLs can't smuggle a foreign or `javascript:` target.

**Cached aggregates** (`avgRating`, `reviewCount`) are recomputed in the **same transaction** as
each review insert, keeping the detail page's summary correct without a separate job.

**`cache: 'no-cache'` on all client GETs.** The API sends CDN-oriented
`s-maxage` + `stale-while-revalidate`; without this, the browser's HTTP cache served a stale review
list right after posting. React Query is the client cache of record, so forcing revalidation (cheap
via ETag 304s) makes a just-posted review appear immediately while preserving shared-cache behavior.

## Consequences

- Reviews work end-to-end today with zero external accounts; production hardening is a config flip
  (set `TURNSTILE_SECRET`) and a storage swap (point uploads at Cloudinary).
- `apps/api/uploads/` is gitignored — user content never enters version control. A real deployment
  must mount persistent storage there or move to object storage.
- Moderation is minimal for now (reviews publish immediately). The `ReviewStatus` enum + soft
  deletes are in place for the Phase 8 admin moderation queue.
- Swap path to Cloudinary: replace `lib/uploads.ts`'s disk storage with an unsigned upload (client
  → Cloudinary → returned URL), widen the review-photo allowlist regex to the CDN host, and drop
  the static route. The two-step upload→submit flow already matches that shape.
