# ADR 0005 — Admin auth: scrypt hashing, DB-backed session cookies, CSRF

**Status:** Accepted · 2026-07-16 (Phase 8)

## Context

The admin console at `/admin` is the only authenticated surface in the app. The blueprint (§14)
called for **argon2id** password hashing and an **httpOnly session cookie + CSRF** — explicitly
_not_ a localStorage JWT. Argon2 in Node means a native addon (`argon2` → node-gyp, or
`@node-rs/argon2` → prebuilt binaries), which adds build/supply-chain friction that this stack has
otherwise avoided (see MapLibre in ADR 0003, local uploads in ADR 0004).

## Decision

**Hashing — `scrypt` (Node built-in) instead of argon2id.** `node:crypto`'s scrypt is memory-hard,
OWASP-recommended, and needs zero dependencies or native builds. Hashes are stored self-describing
(`scrypt$N$r$p$salt$hash`) so the cost parameters can evolve without a migration; verification is
constant-time via `timingSafeEqual`, and a missing account still runs a throwaway hash to equalize
timing (no user enumeration).

**Sessions — opaque token in an httpOnly cookie, backed by an `AdminSession` table.** Login mints a
random 32-byte token; only its SHA-256 hash is stored, so a DB leak can't resume sessions. The
cookie is `httpOnly`, `SameSite=Lax`, `Secure` in production, 7-day TTL. Server-side storage means
logout and expiry are real revocations — not something a stateless JWT can do.

**CSRF — per-session token replayed in an `X-CSRF-Token` header.** Issued at login, returned in the
body (never a readable cookie), and required on every non-GET admin request. Cross-origin JS can't
read it (CORS), and `SameSite=Lax` already blocks the cookie on cross-site POSTs — defence in depth.

**Authorization — `requireAdmin` gates the whole `/admin` API; `requireRole('SUPERADMIN')`** guards
destructive actions (restaurant archive). Every mutation writes an `AuditLog` row.

## Consequences

- Admin auth works today with no native modules, no external service, no key.
- Sessions are revocable and survive server restarts (DB-backed) — but the in-memory login rate
  limiter resets on restart, which is fine for a single-node dev/prod setup.
- **Swap path to argon2id** if ever desired: `lib/password.ts` is the only hashing surface; add the
  new algorithm behind the same `hash`/`verify` interface and rehash-on-login. The `scrypt$…` prefix
  already namespaces the format for a clean migration.
- Passwords are set via seed/DB for now; a self-service admin-management UI (invite, reset, roles)
  is a Phase 9+ addition. The `AdminRole` enum and audit log are already in place for it.
