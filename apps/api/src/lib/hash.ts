import { createHash } from 'node:crypto';
import type { Request } from 'express';

import { env } from '../config/env';

/** One-way, salted SHA-256. Used to derive anti-abuse fingerprints without storing PII. */
export function saltedHash(value: string): string {
  return createHash('sha256').update(`${env.REVIEW_HASH_SALT}:${value}`).digest('hex');
}

/** Unsalted SHA-256 for high-entropy secrets (e.g. emailed edit-link tokens). */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Anonymous fingerprints for a write request. We never persist the raw IP or
 * User-Agent — only these salted hashes, used to rate-limit abuse and to make
 * helpful votes one-per-person without any account.
 */
export function requestFingerprint(req: Request): { ipHash: string; userAgentHash: string } {
  return {
    ipHash: saltedHash(req.ip ?? 'unknown'),
    userAgentHash: saltedHash(req.get('user-agent') ?? 'unknown'),
  };
}
