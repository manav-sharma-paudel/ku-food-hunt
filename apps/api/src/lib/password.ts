import { randomBytes, scrypt, type ScryptOptions, timingSafeEqual } from 'node:crypto';

// scrypt is memory-hard, dependency-free (Node built-in), and OWASP-recommended.
// We use it instead of argon2id to keep the stack free of native build steps — see ADR 0005.
const N = 16_384; // CPU/memory cost (2^14)
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * 1024 * 1024;

/** Promise wrapper — `promisify(scrypt)` loses the options-arg overload in TS. */
function derive(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Hash a password into a self-describing `scrypt$N$r$p$salt$hash` string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derive(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** Constant-time verify against a stored `scrypt$…` hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltHex, hashHex] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await derive(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
