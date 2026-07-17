import type { Request, Response } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from '../middleware/error-handler';

/** Parse and validate req.query against a shared Zod schema; 400 with details on failure. */
export function parseQuery<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.') || 'query'}: ${i.message}`)
      .join('; ');
    throw new HttpError(400, 'VALIDATION_ERROR', details);
  }
  return result.data;
}

/** Parse and validate req.body against a shared Zod schema; 400 with details on failure. */
export function parseBody<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    throw new HttpError(400, 'VALIDATION_ERROR', details);
  }
  return result.data;
}

/** CDN-friendly caching for public GET endpoints. */
export function publicCache(res: Response, seconds = 60): void {
  res.set('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=300`);
}

/**
 * Read a required route param as a plain string. Express 5's param type widens to
 * `string | string[] | undefined` on routes with extra middleware; this narrows it
 * and rejects the (never-in-practice) array/missing cases with a clean 400.
 */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', `Missing route parameter: ${name}`);
  }
  return value;
}
