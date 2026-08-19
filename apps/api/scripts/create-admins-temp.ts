/**
 * One-shot script: create the 4 admin accounts required for production.
 * Run with:  npx tsx scripts/create-admins-temp.ts
 */
import { randomBytes, scrypt } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function derive(password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

async function hashPassword(password: string): Promise<string> {
  const N = 16_384, R = 8, P = 1, KEYLEN = 64, MAXMEM = 128 * 1024 * 1024;
  const salt = randomBytes(16);
  const derived = await derive(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

const admins = [
  { email: 'admin1@kufoodhunt.com', password: 'R6btd3ofLGs4Rc0m0SmAM8ninbZJ_UfV', role: 'SUPERADMIN' as const, name: 'Admin 1' },
  { email: 'admin2@kufoodhunt.com', password: 'uiz9QGRVJLXfoGAl764CfmYicV0WV9EP', role: 'SUPERADMIN' as const, name: 'Admin 2' },
  { email: 'moderator1@kufoodhunt.com', password: 'BcvHqICGN7IDsg-ZLbUxrXq2JWfkohN9', role: 'EDITOR' as const, name: 'Moderator 1' },
  { email: 'moderator2@kufoodhunt.com', password: '5iZeXAoNlqNgs5yB9j5Z-idp0khR9LJG', role: 'EDITOR' as const, name: 'Moderator 2' },
];

for (const a of admins) {
  const passwordHash = await hashPassword(a.password);
  await prisma.admin.upsert({
    where: { email: a.email },
    update: { passwordHash, role: a.role },
    create: { email: a.email, name: a.name, role: a.role, passwordHash },
  });
  console.log(`✓ ${a.email} (${a.role})`);
}

console.log('All admins created.');
await prisma.$disconnect();
