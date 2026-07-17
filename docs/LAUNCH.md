# Launch runbook — KU Food Hunt (Phase 9)

The engineering hardening for launch is in the codebase (security headers, WCAG AA, privacy-first
analytics, graceful shutdown, audit log, soft deletes). This runbook covers the **operational**
steps that live outside the repo — infrastructure, data, and the go-live sequence.

## 0. Pre-flight (in the repo, already done)

- [x] `helmet` security headers — HSTS (1y, preload), `nosniff`, `X-Frame-Options`, `Referrer-Policy`; `/uploads` served with `Cross-Origin-Resource-Policy: cross-origin`.
- [x] Zod validation on every endpoint; Prisma parameterization; no `dangerouslySetInnerHTML` on user content (JSON-LD is `<`-escaped against `</script>` breakout).
- [x] Anonymous-write abuse stack: honeypot + write rate-limit + salted IP/UA hashes + Turnstile-ready (ADR 0004).
- [x] Admin auth: scrypt + httpOnly session cookie + CSRF + role checks + login rate-limit (ADR 0005).
- [x] **WCAG 2.1 AA**: verified with axe-core across landing/explore/detail/map/about/admin in light + dark, 0 violations. Reduced motion honored app-wide.
- [x] Env vars validated at boot; graceful SIGTERM/SIGINT shutdown; `/healthz` liveness endpoint.
- [x] `pnpm audit --prod` → no known vulnerabilities.

## 1. Domain & TLS

1. Register the domain and point DNS at Cloudflare (nameservers).
2. Web app → static host / CDN (e.g. Cloudflare Pages, Netlify). API → a Node host (Fly.io, Railway, a VPS) at `api.<domain>`.
3. Enable **Full (strict)** TLS in Cloudflare; the API origin must serve valid TLS. HSTS is already sent by the API — mirror it at the edge for the web app.

## 2. Cloudflare (edge in front of the domain)

- **CDN cache** the public GET responses (the API already sends `s-maxage` + `stale-while-revalidate`); bypass cache for `/api/v1/admin/*` and any `POST`.
- **WAF + rate limiting + Bot Fight / DDoS** protection on.
- **Content-Security-Policy for the SPA HTML** — set as a Cloudflare Transform Rule / `_headers` file (the API can't set it for the static app). Baseline that fits MapLibre + picsum + optional Plausible:

  ```
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' https://plausible.io;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://picsum.photos https://api.<domain>;
    connect-src 'self' https://api.<domain> https://tiles.openfreemap.org https://plausible.io;
    worker-src blob:;
    font-src 'self' data:;
    frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';
    upgrade-insecure-requests
  ```

  Notes: `worker-src blob:` and `style-src 'unsafe-inline'` are required by maplibre-gl. Drop
  `https://plausible.io` and `picsum.photos` once analytics/placeholder images are finalized (real
  photos move to your CDN/uploads origin). Tighten `img-src`/`connect-src` to your actual hosts.

## 3. Environment (production values)

API (`apps/api/.env`): `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGIN=https://<domain>`,
`SITE_URL=https://<domain>`, a long random `REVIEW_HASH_SALT`, `TURNSTILE_SECRET` (see §5),
`ADMIN_SEED_PASSWORD` (strong; then rotate). Web build: `VITE_SITE_URL=https://<domain>`, and
`VITE_ANALYTICS_DOMAIN` if using analytics (§6).

## 4. Database

- Managed Postgres 17. Run `prisma migrate deploy` on release.
- **Daily automated backups with a tested restore** (do a real restore drill before launch).
- Soft deletes + audit log are already in place — no destructive admin action is irreversible.

## 5. Anti-abuse (turn on for prod)

- Create a **Cloudflare Turnstile** widget; set `TURNSTILE_SECRET` (API) and wire the site key into
  the review form. `verifyTurnstile()` enforces automatically once the secret is present (ADR 0004).
- Review the rate-limit ceilings (`middleware/rate-limit.ts`) against expected traffic.

## 5b. Partner onboarding (subdomain + email)

- **DNS**: add `partners.<domain>` as a CNAME/custom domain pointing at the _same_ web app
  deployment (Cloudflare Pages: add it as a custom domain on the existing project). The SPA
  detects the `partners.` host and lands visitors on the submission form — no separate build.
  Mirror the same CSP/HSTS edge headers as the main domain.
- **Email (Resend)**: create a Resend account, verify the sending domain (add their DKIM/SPF
  DNS records), then set `RESEND_API_KEY` and `MAIL_FROM` on the API. Set
  `PARTNERS_URL=https://partners.<domain>` so emailed edit links point at the subdomain.
  Until the key is set, notification emails are logged, not sent — owners won't hear back,
  so treat this as required for launch of the partner flow.
- **Anti-abuse**: the form already sits behind the honeypot, the `submissionLimiter`
  (6/hr/IP), and the Turnstile stack (§5). Nothing a submitter does is public until an
  admin approves it.

## 6. Uploads & analytics

- **Uploads**: dev writes to local disk (`apps/api/uploads`, gitignored). For prod, either mount a
  persistent volume there **or** swap `lib/uploads.ts` to Cloudinary (unsigned upload → strips EXIF
  GPS, re-encodes) per ADR 0004. Cap size/format server-side (already 4 MB, JPEG/PNG/WebP).
- **Analytics**: set `VITE_ANALYTICS_DOMAIN` (Plausible). It's cookieless, respects Do Not Track,
  and no-ops if unset — no consent banner required.

## 7. Data entry (the launch long pole)

- Replace the seed's placeholder restaurants with **real on-the-ground data**: names, coordinates
  (use the admin Location map picker), hours, menus + NPR prices, and photos.
- Do it in the admin console; keep new spots as **Draft** until verified, then Publish.
- Curate the homepage: featured list + hero copy in **Admin → Homepage**.

## 8. Go-live sequence

1. Deploy API + web; run `migrate deploy`; smoke-test `/healthz` and a few public routes.
2. Seed/confirm the admin account; **rotate the admin password**; verify login + CSRF.
3. Enter real data (§7); QA on mobile + desktop, light + dark.
4. **Pilot**: soft-launch to a small KU student group; watch logs, error rates, and Turnstile/rate-limit hits.
5. Fix, then **public launch**: announce, submit `sitemap.xml` to Search Console, monitor.

## 9. Post-launch monitoring

- Uptime check on `/healthz`; error alerting on API 5xx (pino structured logs with request IDs).
- Weekly `pnpm audit`; watch Cloudflare analytics + Plausible for traffic and abuse patterns.
