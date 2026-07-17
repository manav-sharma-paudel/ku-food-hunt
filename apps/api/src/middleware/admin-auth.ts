import { timingSafeEqual } from 'node:crypto';

import type { AdminRoleValue } from '@ku-food-hunt/shared';
import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../lib/prisma';
import { resolveSession, SESSION_COOKIE, type ActiveSession } from '../lib/session';
import { HttpError } from './error-handler';

export interface AdminContext {
  id: string;
  email: string;
  name: string;
  role: AdminRoleValue;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminContext;
      adminSession?: ActiveSession;
    }
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Constant-time string comparison — a plain `!==` leaks match length via timing. */
function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Gate for every admin endpoint: requires a live session cookie, and on writes a
 * matching `X-CSRF-Token` header. Attaches the admin + session to the request.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = await resolveSession(token);
  if (!session) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');

  if (!SAFE_METHODS.has(req.method)) {
    const csrf = req.get('x-csrf-token');
    if (!csrf || !tokensMatch(csrf, session.csrfToken)) {
      throw new HttpError(403, 'CSRF_FAILED', 'Your session expired. Refresh and try again.');
    }
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!admin) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');

  req.admin = admin;
  req.adminSession = session;
  next();
}

/** Restrict a route to specific roles (must run after requireAdmin). */
export function requireRole(...roles: AdminRoleValue[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action.');
    }
    next();
  };
}
