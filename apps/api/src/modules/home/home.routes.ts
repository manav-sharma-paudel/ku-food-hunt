import { Router } from 'express';

import { publicCache } from '../../lib/http';
import { getHomePayload } from './home.service';

export const homeRouter = Router();

homeRouter.get('/', async (_req, res) => {
  const payload = await getHomePayload();
  publicCache(res);
  res.json({ data: payload });
});
