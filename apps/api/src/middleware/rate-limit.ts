import { rateLimit } from 'express-rate-limit';

const jsonError = (code: string, message: string) => ({ error: { code, message } });

/**
 * Tight limiter for anonymous write endpoints (review submission, photo upload).
 * Far stricter than the global read limiter — one enthusiastic student won't hit
 * it, but a script hammering the form will.
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonError('RATE_LIMITED', 'You are doing that too often. Please try again later.'),
});

/** Helpful-vote toggles are cheap and idempotent, so allow a higher ceiling. */
export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonError('RATE_LIMITED', 'You are doing that too often. Please try again later.'),
});

/**
 * Partner onboarding submissions: a legitimate owner submits once, maybe twice
 * after fixing a rejection — anything beyond a handful per hour is a script.
 */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonError(
    'RATE_LIMITED',
    'Too many submissions from this connection. Please try again later.',
  ),
});

/** Throttles admin login attempts to blunt credential-stuffing. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: jsonError('RATE_LIMITED', 'Too many login attempts. Please wait a few minutes.'),
});
