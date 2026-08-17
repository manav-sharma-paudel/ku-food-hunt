import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions, Response } from 'express';

import { env } from '../config/env';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'kfh_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

/** Look up a live session by its raw cookie token; prunes it if expired. */
export async function resolveSession(token: string | undefined): Promise<ActiveSession | null> {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, adminId: true, csrfToken: true, expiresAt: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return { id: session.id, adminId: session.adminId, csrfToken: session.csrfToken };
}

export async function destroySession(res: Response, token: string | undefined): Promise<void> {
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
}
