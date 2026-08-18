import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

import { logger } from './logger';
import { prisma } from './prisma';
import { RESTAURANT_PHOTOS_DIR, REVIEW_PHOTOS_DIR } from './uploads';

const DIRS = [
  { dir: REVIEW_PHOTOS_DIR, urlPrefix: '/uploads/reviews/' },
  { dir: RESTAURANT_PHOTOS_DIR, urlPrefix: '/uploads/restaurants/' },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Delete upload files older than `olderThanMs` that no DB row references.
 *
 * The public `/uploads/review-photo` endpoint stores a file *before* any review
 * exists, so an abandoned upload (form opened, photo added, never submitted)
 * would otherwise sit on disk forever — an unauthenticated path to unbounded
 * disk growth. This reconciles disk against the image tables and is best-effort:
 * only old *and* unreferenced files are removed, so an in-progress upload that
 * hasn't been submitted yet is never touched.
 */
export async function sweepOrphanUploads(olderThanMs = DAY_MS): Promise<number> {
  const cutoff = Date.now() - olderThanMs;
  let removed = 0;

  for (const { dir, urlPrefix } of DIRS) {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      continue; // directory may not exist (e.g. read-only serverless FS)
    }

    for (const name of names) {
      const full = path.join(dir, name);
      let info;
      try {
        info = await stat(full);
      } catch {
        continue;
      }
      if (!info.isFile() || info.mtimeMs > cutoff) continue;

      const url = urlPrefix + name;
      const referenced =
        (await prisma.reviewImage.count({ where: { url } })) > 0 ||
        (await prisma.restaurantImage.count({ where: { url } })) > 0;
      if (!referenced) {
        await unlink(full).catch(() => {});
        removed++;
      }
    }
  }

  if (removed > 0) logger.info({ removed }, 'Swept orphaned upload files');
  return removed;
}

/** Kick the sweep off shortly after boot, then run it daily. Timers are unref'd. */
export function scheduleOrphanSweep(): void {
  const run = () =>
    void sweepOrphanUploads().catch((err) => logger.error({ err }, 'Upload sweep failed'));
  setTimeout(run, 60_000).unref();
  setInterval(run, DAY_MS).unref();
}
