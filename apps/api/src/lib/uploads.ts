import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

import { imageSize } from 'image-size';
import multer, { MulterError } from 'multer';

import { HttpError } from '../middleware/error-handler';

/**
 * Local disk storage for review photos — the dev-grade stand-in for Cloudinary.
 * The stored URL shape (`/uploads/reviews/<uuid>.<ext>`) matches what the review
 * schema allows, so swapping in a real CDN later only changes where the file lands.
 */
export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
export const REVIEW_PHOTOS_DIR = path.join(UPLOADS_ROOT, 'reviews');
export const RESTAURANT_PHOTOS_DIR = path.join(UPLOADS_ROOT, 'restaurants');

// On serverless platforms (Vercel) the filesystem outside /tmp is read-only,
// so directory creation is best-effort — uploads simply won't work there until
// a cloud storage adapter (S3 / Cloudinary) is wired in.
try {
  mkdirSync(REVIEW_PHOTOS_DIR, { recursive: true });
  mkdirSync(RESTAURANT_PHOTOS_DIR, { recursive: true });
} catch {
  // Silently ignore — upload routes will return an error at request time.
}

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB

// A 4 MB file can still decode to an enormous raster (a "decompression bomb"):
// e.g. a highly-compressible PNG declaring 30000×30000 px. Serving that hangs or
// OOMs every browser that renders it, so we cap the decoded pixel count too.
export const MAX_IMAGE_PIXELS = 30_000_000; // ~30 megapixels

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** A single-image multer instance writing content-hashed files into `dir`. */
function photoUpload(dir: string) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, dir),
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXT_BY_MIME[file.mimetype]}`),
    }),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype in EXT_BY_MIME) cb(null, true);
      else cb(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, or WebP images work.'));
    },
  });
}

export const reviewPhotoUpload = photoUpload(REVIEW_PHOTOS_DIR);
export const restaurantPhotoUpload = photoUpload(RESTAURANT_PHOTOS_DIR);

// Multer's fileFilter only sees the client-declared Content-Type, so the bytes on
// disk could be anything. Check the file's magic numbers against that claim and
// drop the file if they don't match — nothing non-image gets served from /uploads.
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) =>
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP',
};

/**
 * Reject (and delete) an upload that isn't genuinely the image type it claims —
 * either because its magic bytes don't match, or because its decoded dimensions
 * are implausibly large (a decompression bomb).
 */
export async function assertPhotoSignature(file: Express.Multer.File): Promise<void> {
  const reject = async (status: number, code: string, message: string): Promise<never> => {
    await unlink(file.path).catch(() => {});
    throw new HttpError(status, code, message);
  };

  let buf: Buffer;
  try {
    buf = await readFile(file.path);
  } catch {
    return reject(415, 'UNSUPPORTED_MEDIA_TYPE', 'That file is not a valid image.');
  }

  const matches = SIGNATURES[file.mimetype];
  if (!matches?.(buf.subarray(0, 12))) {
    return reject(415, 'UNSUPPORTED_MEDIA_TYPE', 'That file is not a valid image.');
  }

  let dims: { width?: number; height?: number };
  try {
    dims = imageSize(buf);
  } catch {
    return reject(415, 'UNSUPPORTED_MEDIA_TYPE', 'That file is not a valid image.');
  }
  const width = dims.width ?? 0;
  const height = dims.height ?? 0;
  if (width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
    return reject(413, 'PAYLOAD_TOO_LARGE', 'That image is too large in dimensions.');
  }
}

/**
 * Delete the file backing a stored photo URL.
 *
 * Removing the database row alone is not enough: /uploads is served straight off
 * disk with `immutable, max-age=30d`, so an orphaned file stays publicly
 * fetchable at its original URL forever. Anyone who saw the URL — or scraped it
 * before moderation — keeps access to a photo an admin believes they deleted.
 *
 * The filename is re-validated here rather than trusted from the database, so a
 * malformed or hand-edited row can never walk this out of the uploads tree.
 */
const STORED_PHOTO_URL = /^\/uploads\/(reviews|restaurants)\/([\w-]+\.(?:jpe?g|png|webp))$/i;

export async function deleteStoredPhoto(url: string): Promise<void> {
  const match = STORED_PHOTO_URL.exec(url);
  if (!match) return;

  const [, dir, filename] = match as unknown as [string, string, string];
  const target = path.join(UPLOADS_ROOT, dir, filename);

  // Belt and braces: the regex already forbids separators and `..`, but resolve
  // and confirm containment before unlinking anything.
  const resolved = path.resolve(target);
  if (resolved !== target || !resolved.startsWith(UPLOADS_ROOT + path.sep)) return;

  // ENOENT is fine — the row outliving the file is the harmless direction.
  await unlink(resolved).catch(() => {});
}

/** Turn multer's internal errors into the app's HttpError envelope. */
export function translateUploadError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new HttpError(413, 'PAYLOAD_TOO_LARGE', 'That image is over the 4 MB limit.');
    }
    return new HttpError(400, 'UPLOAD_ERROR', 'That upload could not be processed.');
  }
  return new HttpError(400, 'UPLOAD_ERROR', 'That upload could not be processed.');
}
