import { adminLoginSchema, type AdminUserDto } from '@ku-food-hunt/shared';
import type { Admin } from '@prisma/client';
import { Router } from 'express';

import { writeAudit } from '../../lib/audit';
import { parseBody } from '../../lib/http';
import { hashPassword, verifyPassword } from '../../lib/password';
import { prisma } from '../../lib/prisma';
import { createSession, destroySession, SESSION_COOKIE } from '../../lib/session';
import { requireAdmin } from '../../middleware/admin-auth';
import { HttpError } from '../../middleware/error-handler';
import { loginLimiter } from '../../middleware/rate-limit';

export const adminAuthRouter = Router();

export function toAdminUser(a: Admin): AdminUserDto {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
  };
}

// Verifying against a throwaway hash on a missing account equalizes response
// timing, so an attacker can't distinguish "no such user" from "wrong password".
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = () => (dummyHashPromise ??= hashPassword('timing-equalizer'));

adminAuthRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parseBody(adminLoginSchema, req);
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

  let ok = false;
  if (admin) ok = await verifyPassword(password, admin.passwordHash);
  else await verifyPassword(password, await getDummyHash());

  if (!admin || !ok) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const { csrfToken } = await createSession(res, admin.id);
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await writeAudit(admin.id, 'admin.login', 'admin', admin.id);

  res.json({ data: { admin: toAdminUser(updated), csrfToken } });
});

adminAuthRouter.get('/me', requireAdmin, async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin!.id } });
  if (!admin) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  res.json({ data: { admin: toAdminUser(admin), csrfToken: req.adminSession!.csrfToken } });
});

adminAuthRouter.post('/logout', requireAdmin, async (req, res) => {
  await destroySession(res, req.cookies?.[SESSION_COOKIE] as string | undefined);
  res.status(204).end();
});
