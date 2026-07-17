import {
  createReviewSchema,
  restaurantListQuerySchema,
  reviewListQuerySchema,
} from '@ku-food-hunt/shared';
import { Router } from 'express';

import { requestFingerprint } from '../../lib/hash';
import { parseBody, parseQuery, publicCache, requireParam } from '../../lib/http';
import { verifyTurnstile } from '../../lib/turnstile';
import { HttpError } from '../../middleware/error-handler';
import { writeLimiter } from '../../middleware/rate-limit';
import { createReview } from '../reviews/reviews.service';
import { getRestaurantDetail, listRestaurants, listReviews } from './restaurants.service';

export const restaurantsRouter = Router();

restaurantsRouter.get('/', async (req, res) => {
  const query = parseQuery(restaurantListQuerySchema, req);
  const result = await listRestaurants(query);
  publicCache(res);
  res.json(result);
});

restaurantsRouter.get('/:slug', async (req, res) => {
  const detail = await getRestaurantDetail(req.params.slug);
  publicCache(res);
  res.json({ data: detail });
});

restaurantsRouter.get('/:slug/reviews', async (req, res) => {
  const query = parseQuery(reviewListQuerySchema, req);
  const result = await listReviews(req.params.slug, query);
  publicCache(res, 30);
  res.json(result);
});

restaurantsRouter.post('/:slug/reviews', writeLimiter, async (req, res) => {
  const input = parseBody(createReviewSchema, req);
  const passed = await verifyTurnstile(input.turnstileToken, req.ip ?? 'unknown');
  if (!passed) {
    throw new HttpError(403, 'CHALLENGE_FAILED', 'Verification failed. Please try again.');
  }
  const review = await createReview(requireParam(req, 'slug'), input, requestFingerprint(req));
  res.status(201).json({ data: review });
});
