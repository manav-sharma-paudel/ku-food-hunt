# ADR 0006 — Partner onboarding: same SPA, same table, statuses over new models

Date: 2026-07-17 · Status: accepted

## Context

Restaurant owners need a public place (`partners.<domain>`) to submit their restaurant,
with submissions held for admin approval before going live.

## Decisions

1. **Same SPA, own route branch.** `/partners` is a lazy branch in `apps/web` exactly like
   `/admin` — it reuses the design system, shared Zod schemas, and upload pipeline. The
   subdomain is pure DNS/hosting: `partners.<domain>` serves the same bundle, and the router
   rewrites that host's root to `/partners`. A separate deployable would have required
   extracting the token/primitive layer into a package for no benefit at this scale.

2. **Same `Restaurant` table, two new statuses.** Submissions are ordinary restaurant rows
   with `status: PENDING` (new) — approval flips them to the existing `PUBLISHED`, rejection
   to `REJECTED` (new). No parallel "submission" model, so an approved listing _is_ the live
   listing: hours, menu photos, categories, and images all land in their final tables on
   submission. Public queries already hard-filter `PUBLISHED`, so nothing pending can leak.
   Transition rules live in `packages/shared/src/utils/submission-status.ts` (tested).

3. **Submitter contact ≠ public contact.** `submitterName/Email/Phone`, `submittedAt`, and
   `rejectionReason` are columns on the row, surfaced only through the admin API.

4. **No owner accounts; signed edit links.** Resubmission uses a 32-byte token, stored only
   as a SHA-256 hash (`resubmitTokenHash`), rotated on every submission and rejection.
   The link reopens the form pre-filled; saving updates the same row and resets it to
   PENDING — no duplicates, no auth system.

5. **No email verification before creation.** Admin review is the fraud gate; the form is
   protected by the existing honeypot + rate-limit + Turnstile stack (ADR 0004). A fake
   email only means the owner never hears back.

6. **Email = Resend over plain HTTPS, env-gated.** `lib/mailer.ts` logs instead of sending
   when `RESEND_API_KEY` is unset (the Turnstile/analytics pattern), and never throws — a
   mail outage must not fail a submission or an admin decision. No SDK dependency.
