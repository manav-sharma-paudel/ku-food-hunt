import { Router } from 'express';

import { publicCache } from '../../lib/http';
import { listMapRestaurants } from './map.service';

export const mapRouter = Router();

mapRouter.get('/restaurants', async (_req, res) => {
  const restaurants = await listMapRestaurants();
  publicCache(res, 120);
  res.json({ data: restaurants });
});
