import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Public origin used for absolute URLs in the sitemap. Set to the real domain in prod.
  SITE_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * How many reverse proxies sit in front of this app. Express walks back this
   * many hops through X-Forwarded-For to resolve `req.ip`, which every rate
   * limiter and the salted IP hash on reviews depend on — so a wrong value is
   * not cosmetic:
   *
   *   too low  → req.ip is the CDN's edge address, identical for every visitor,
   *              so all rate limits collapse into one shared global bucket
   *   too high → req.ip is read straight from a client-supplied header, so every
   *              rate limit is bypassed by forging X-Forwarded-For
   *
   * 0 = the app is exposed directly (X-Forwarded-For is ignored entirely).
   * 1 = exactly one proxy, e.g. the nginx container in docker-compose.yml.
   * 2 = a CDN in front of a platform router, e.g. Cloudflare → Railway.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  // Salts the one-way IP/User-Agent hashes attached to reviews and helpful votes;
  // raw IPs are never stored. Override with a long random value in production.
  REVIEW_HASH_SALT: z.string().min(1).default('kfh-dev-salt-change-me'),
  // Cloudflare Turnstile secret. When unset (dev), the review form skips the check;
  // when present (prod), submissions must carry a valid token.
  TURNSTILE_SECRET: z.string().optional(),
  // Deliberate, explicit opt-out from bot protection in production. Without this,
  // a production boot with no TURNSTILE_SECRET fails closed rather than silently
  // running with the challenge disabled (see the production check below).
  TURNSTILE_DISABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  // Transactional email via Resend. When unset (dev), emails are logged, not sent.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('KU Food Hunt <onboarding@resend.dev>'),
  // Public origin of the partner onboarding form, used in emailed edit links
  // (e.g. https://partners.kufoodhunt.app). Defaults to SITE_URL.
  PARTNERS_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger depends on env, so this must use console.
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

// The dev defaults are published in the repo, so production must never run with
// them: a known REVIEW_HASH_SALT lets anyone brute-force the "anonymous" IP
// hashes back to real addresses (the IPv4 space is small enough to enumerate).
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.REVIEW_HASH_SALT === 'kfh-dev-salt-change-me') {
    console.error(
      'Refusing to start: REVIEW_HASH_SALT is still the dev default. Set a long random value.',
    );
    process.exit(1);
  }
  // Bot protection must not be silently off in production. Either configure
  // Turnstile (TURNSTILE_SECRET + the client widget) or opt out on purpose with
  // TURNSTILE_DISABLED=true — a warning alone is too easy to miss.
  if (!parsed.data.TURNSTILE_SECRET && !parsed.data.TURNSTILE_DISABLED) {
    console.error(
      'Refusing to start: TURNSTILE_SECRET is not set in production, so review and partner ' +
        'submissions would run with no bot protection. Set TURNSTILE_SECRET (recommended), or ' +
        'set TURNSTILE_DISABLED=true to run without it deliberately.',
    );
    process.exit(1);
  }
  // req.ip drives every rate limiter and the salted review/vote fingerprint. If
  // the app sits behind a proxy/CDN (Vercel, Railway, nginx) but TRUST_PROXY is
  // 0, req.ip collapses to the proxy's address for every visitor — one shared
  // rate-limit bucket and one shared fingerprint. Loudly flag the likely misconfig.
  if (parsed.data.TRUST_PROXY === 0) {
    console.warn(
      'TRUST_PROXY is 0 in production. If this app runs behind any proxy/CDN, set it to the real ' +
        'proxy hop count (e.g. 1 for a single nginx/Railway edge, 2 for Vercel→Railway) — otherwise ' +
        'every rate limiter and the review/vote fingerprint collapse into one global bucket.',
    );
  }
}

export const env = parsed.data;
