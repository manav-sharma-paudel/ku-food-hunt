import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions, Response } from 'express';

import { env } from '../config/env';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'kfh_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (absolute lifetime)
// Idle timeout: a session unused for this long is killed even within its absolute
// window, so a captured cookie from an abandoned session stops working sooner.
const IDLE_TIMEOUT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
// Only rewrite lastUsedAt when it's this stale, so we don't write on every request.
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'none',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}

export interface ActiveSession {
  id: string;
  adminId: string;
  csrfToken: string;
}

/**
 * Mint a new session: a random opaque token lives in the cookie, only its hash
 * is stored. A separate CSRF token is returned to the client and echoed back in
 * an `X-CSRF-Token` header on writes (defence-in-depth over the SameSite cookie).
 */
export async function createSession(
  res: Response,
  adminId: string,
): Promise<{ csrfToken: string }> {
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');

  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash: sha256(token),
      csrfToken,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  res.cookie(SESSION_COOKIE, token, cookieOptions());
  return { csrfToken };
}

/** Look up a live session by its raw cookie token; prunes it if expired or idle. */
export async function resolveSession(token: string | undefined): Promise<ActiveSession | null> {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, adminId: true, csrfToken: true, expiresAt: true, lastUsedAt: true },
  });
  if (!session) return null;

  const now = Date.now();
  const idleFor = now - session.lastUsedAt.getTime();
  if (session.expiresAt.getTime() < now || idleFor > IDLE_TIMEOUT_MS) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Slide the activity marker forward, but only occasionally to avoid a write on
  // every authenticated request.
  if (idleFor > ACTIVITY_WRITE_THROTTLE_MS) {
    await prisma.adminSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date(now) } })
      .catch(() => {});
  }

  return { id: session.id, adminId: session.adminId, csrfToken: session.csrfToken };
}

export async function destroySession(res: Response, token: string | undefined): Promise<void> {
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
}
