import {
  featuredUpdateSchema,
  heroSettingSchema,
  reviewModerationQuerySchema,
  reviewModerationSchema,
} from '@ku-food-hunt/shared';
import { Router } from 'express';

import { parseBody, parseQuery, requireParam } from '../../lib/http';
import { deleteReview, listReviewsForModeration, moderateReview } from './admin-moderation.service';
import {
  getHero,
  getOverview,
  listAuditLogs,
  setFeatured,
  setHero,
} from './admin-settings.service';

export const adminEditorialRouter = Router();

adminEditorialRouter.get('/overview', async (_req, res) => {
  res.json({ data: await getOverview() });
});

// ————————————————————————————————— Review moderation

adminEditorialRouter.get('/reviews', async (req, res) => {
  const query = parseQuery(reviewModerationQuerySchema, req);
  res.json(await listReviewsForModeration(query));
});

adminEditorialRouter.patch('/reviews/:id', async (req, res) => {
  const { status } = parseBody(reviewModerationSchema, req);
  await moderateReview(requireParam(req, 'id'), status, req.admin!.id);
  res.status(204).end();
});

adminEditorialRouter.delete('/reviews/:id', async (req, res) => {
  await deleteReview(requireParam(req, 'id'), req.admin!.id);
  res.status(204).end();
});

// ————————————————————————————————— Homepage manager

adminEditorialRouter.get('/hero', async (_req, res) => {
  res.json({ data: await getHero() });
});

adminEditorialRouter.put('/hero', async (req, res) => {
  const input = parseBody(heroSettingSchema, req);
  res.json({ data: await setHero(input, req.admin!.id) });
});

adminEditorialRouter.put('/featured', async (req, res) => {
  const { ids } = parseBody(featuredUpdateSchema, req);
  await setFeatured(ids, req.admin!.id);
  res.status(204).end();
});

// ————————————————————————————————— Audit trail

adminEditorialRouter.get('/audit', async (_req, res) => {
  res.json({ data: await listAuditLogs() });
});
