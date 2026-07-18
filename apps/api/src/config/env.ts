import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  // Public origin used for absolute URLs in the sitemap. Set to the real domain in prod.
  SITE_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Salts the one-way IP/User-Agent hashes attached to reviews and helpful votes;
  // raw IPs are never stored. Override with a long random value in production.
  REVIEW_HASH_SALT: z.string().min(1).default('kfh-dev-salt-change-me'),
  // Cloudflare Turnstile secret. When unset (dev), the review form skips the check;
  // when present (prod), submissions must carry a valid token.
  TURNSTILE_SECRET: z.string().optional(),
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
  if (!parsed.data.TURNSTILE_SECRET) {
    console.warn(
      'TURNSTILE_SECRET is not set: review and partner submissions run without bot protection.',
    );
  }
}

export const env = parsed.data;
