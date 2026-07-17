import { searchSuggestQuerySchema } from '@ku-food-hunt/shared';
import { Router } from 'express';

import { parseQuery, publicCache } from '../../lib/http';
import { suggest } from './search.service';

export const searchRouter = Router();

searchRouter.get('/suggest', async (req, res) => {
  const { q } = parseQuery(searchSuggestQuerySchema, req);
  const suggestions = await suggest(q);
  publicCache(res, 30);
  res.json({ data: suggestions });
});
