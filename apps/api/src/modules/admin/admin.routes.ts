import { Router } from 'express';

import { requireAdmin } from '../../middleware/admin-auth';
import { adminEditorialRouter } from './admin-editorial.routes';
import { adminRestaurantsRouter } from './admin-restaurants.routes';
import { adminUploadsRouter } from './admin-uploads.routes';
import { adminAuthRouter } from './auth.routes';

/**
 * Everything under /api/v1/admin. `/auth` is public (login); every other admin
 * router sits behind requireAdmin (session cookie + CSRF on writes).
 */
export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/restaurants', requireAdmin, adminRestaurantsRouter);
adminRouter.use('/uploads', requireAdmin, adminUploadsRouter);
adminRouter.use('/', requireAdmin, adminEditorialRouter);
