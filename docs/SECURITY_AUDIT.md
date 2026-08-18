# Security & Correctness Audit — 2026-08-18

A multi-agent review swept the codebase across 8 dimensions (auth/session/CSRF, injection,
file uploads, DoS/rate-limiting/secrets, XSS/frontend, backend correctness, frontend
correctness, deploy/deps). Every finding was adversarially re-verified, which rejected 12
false positives and confirmed **19 real issues** — no critical or high-severity holes.

The core auth is well built: scrypt password hashing, session tokens stored only as SHA-256
hashes, CSRF tokens on writes, timing-safe comparisons, no raw SQL, properly-escaped JSON-LD.

## Status legend

- ✅ **Fixed** — code changed and verified (typecheck + tests + lint + build, plus runtime checks where noted).
- ⚙️ **Needs your action** — code hardened, but a value must be set on your hosting platform / an external account.

---

## Medium

| #     | Issue                                                                                                                                                                    | Status                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Rate limiters collapse behind proxy** — `TRUST_PROXY` defaults to `0`; behind Vercel→Railway every visitor shares one rate-limit bucket + one review/vote fingerprint. | ⚙️ Code now warns loudly at prod boot; **you must set `TRUST_PROXY` on Railway** (`2` for Vercel→Railway, `1` for a single nginx edge). |
| 2 / 7 | **Production SPA had no security headers** — CSP/X-Frame-Options lived only in nginx, which Vercel doesn't use. Live site was framable, no CSP.                          | ✅ Added a `headers` block to `vercel/web.json` (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, COOP, HSTS).                      |

## Low

| #      | Issue                                                                                                                 | Status                                                                                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3      | **Image decompression-bomb** — a 4 MB file could declare 30000×30000 px and hang every viewer's browser.              | ✅ `assertPhotoSignature` now decodes dimensions (`image-size`) and rejects > 30 MP. Runtime-verified.                                                                                                              |
| 4      | **Orphaned uploads** — public upload endpoint stores files that may never attach to a review → unbounded disk growth. | ✅ Added a daily `sweepOrphanUploads` job (removes old, unreferenced files; long-lived process only).                                                                                                               |
| 5      | **Turnstile inert in prod** — `verifyTurnstile` returns `true` when no secret is set.                                 | ⚙️ Prod now **refuses to boot** without `TURNSTILE_SECRET` unless you set `TURNSTILE_DISABLED=true`. Full protection still needs the client widget wired with your Cloudflare site key (see below).                 |
| 6 / 16 | **Public default admin** `admin@kufoodhunt.app` / `kufoodhunt-dev` in the seed.                                       | ✅ Seed no longer has any default email or fallback password — admin creation is opt-in (`ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD`), never resets existing accounts. The public account does not exist in your DB. |
| 8      | **Review rating race** — concurrent review writes could desync cached `avgRating`/`reviewCount`.                      | ✅ `recomputeRestaurantRating` now takes a `SELECT … FOR UPDATE` row lock to serialize recomputes.                                                                                                                  |
| 9      | **Helpful-vote 500** — concurrent double-click hit a unique-constraint 500 instead of toggling.                       | ✅ Rewrote as idempotent `deleteMany`/`createMany(skipDuplicates)`. Runtime-verified: 5 concurrent votes → all 200, count consistent.                                                                               |
| 10     | **Partner resubmission orphaned files** — old photos left on disk after resubmit.                                     | ✅ Now deletes backing files for images dropped on resubmit.                                                                                                                                                        |
| 11     | **ReviewCard stale count** — helpful count didn't re-sync on background refetch.                                      | ✅ Added a value-keyed `useEffect` re-sync (never clobbers optimistic updates).                                                                                                                                     |
| 12     | **useScrollSpy churn** — re-subscribed the scroll listener every render.                                              | ✅ Hook now depends on the id _values_, not the array reference.                                                                                                                                                    |
| 13     | **useGeolocation non-memoized** — returned a fresh object each render.                                                | ✅ Wrapped the return in `useMemo`.                                                                                                                                                                                 |
| 14     | **No CI security gate.**                                                                                              | ✅ Added `pnpm audit --audit-level=high` + a gitleaks secret-scan job to `ci.yml`.                                                                                                                                  |
| 15     | **API image ships dev toolchain + TS source.**                                                                        | ⚙️ Not changed — the restructure can't be verified without a Docker build here. See "Recommended" below.                                                                                                            |
| 17     | **pnpm version mismatch** between the two Dockerfiles.                                                                | ✅ Pinned web Dockerfile to `11.15.1`.                                                                                                                                                                              |

## Info

| #   | Issue                                                                               | Status                                                                                                            |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 18  | **No per-account login lockout** — only per-IP; distributed guessing wasn't slowed. | ✅ Added `failedLoginCount`/`lockedUntil` on `Admin`; 8 failures → 15-min lockout, layered on the per-IP limiter. |
| 19  | **7-day sessions, no idle timeout.**                                                | ✅ Added `lastUsedAt` on `AdminSession` + a 2-day idle timeout with throttled sliding activity.                   |

---

## What you still need to do

1. **Set `TRUST_PROXY` on Railway** (finding #1) — most likely `2` for the Vercel→Railway path. Without it, rate limiting is effectively off.
2. **Decide on Turnstile** (finding #5) — before the next production deploy, either:
   - set `TURNSTILE_SECRET` and wire the Cloudflare Turnstile widget on the review/partner forms with your site key, **or**
   - set `TURNSTILE_DISABLED=true` to run without bot protection deliberately.
   - ⚠️ The API now refuses to boot in production if neither is set.
3. **Set `TRUST_PROXY` for the Vercel serverless API too** if you deploy via `vercel/api.json`.

## Recommended (not done — needs a Docker build to verify)

- **Finding #15**: trim the API production image so devDependencies + TS source don't ship. The
  Dockerfile's own comment warns that naively copying subsets breaks pnpm's Prisma symlinks, so
  this needs a `pnpm deploy --prod` (or `--prod` prune) into a clean runner stage — and a real
  `docker build` to confirm the Prisma engine still resolves. Left for a verified pass.

## Schema change

A migration was added and applied to the local DB:
`20260818000000_add_admin_lockout_and_session_activity` — adds `Admin.failedLoginCount`,
`Admin.lockedUntil`, `AdminSession.lastUsedAt`. Run `prisma migrate deploy` on other environments.
