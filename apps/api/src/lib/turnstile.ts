import { env } from '../config/env';
import { logger } from './logger';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token. Disabled by default: when no secret is
 * configured (local dev), this resolves `true` and makes no network call, so the
 * review form works out of the box. In production, set TURNSTILE_SECRET and the
 * client's site key to require a real human challenge.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    logger.error({ err }, 'Turnstile verification failed');
    return false;
  }
}
