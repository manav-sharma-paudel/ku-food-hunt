/**
 * One-off admin provisioning: creates named admin accounts with freshly
 * generated passwords. Safe to re-run — an email that already exists is
 * skipped rather than having its password silently reset.
 *
 * Usage: pnpm --filter @ku-food-hunt/api exec tsx scripts/create-admins.ts
 */
import { randomBytes } from 'node:crypto';

import { PrismaClient, type AdminRole } from '@prisma/client';

import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

interface NewAdmin {
  email: string;
  name: string;
  role: AdminRole;
}

const ADMINS: NewAdmin[] = [
  { email: 'admin1@kufoodhunt.com', name: 'Admin One', role: 'SUPERADMIN' },
  { email: 'admin2@kufoodhunt.com', name: 'Admin Two', role: 'SUPERADMIN' },
];

/** URL-safe random password — long enough to be secure, short enough to paste. */
function generatePassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main() {
  const results: { email: string; name: string; password?: string; status: string }[] = [];

  for (const admin of ADMINS) {
    const existing = await prisma.admin.findUnique({ where: { email: admin.email } });
    if (existing) {
      results.push({
        email: admin.email,
        name: admin.name,
        status: 'already exists — skipped, password unchanged',
      });
      continue;
    }

    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    await prisma.admin.create({
      data: { email: admin.email, name: admin.name, role: admin.role, passwordHash },
    });
    results.push({ email: admin.email, name: admin.name, password, status: 'created' });
  }

  console.log('\nAdmin account results:\n');
  for (const r of results) {
    console.log(`  ${r.email} (${r.name}) — ${r.status}`);
    if (r.password) console.log(`    password: ${r.password}`);
  }
  console.log('\nSave any passwords printed above now — they are hashed on save and not recoverable.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
