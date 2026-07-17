import { Router } from 'express';

import { publicCache } from '../../lib/http';
import { listCategories } from './categories.service';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const categories = await listCategories();
  publicCache(res, 300);
  res.json({ data: categories });
});
