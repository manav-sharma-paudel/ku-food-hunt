import {
  adminRestaurantListQuerySchema,
  hoursUpsertSchema,
  imageCreateSchema,
  imageReorderSchema,
  imageUpdateSchema,
  menuUpsertSchema,
  restaurantCreateSchema,
  restaurantUpdateSchema,
  submissionRejectSchema,
} from '@ku-food-hunt/shared';
import { Router } from 'express';

import { parseBody, parseQuery, requireParam } from '../../lib/http';
import { requireRole } from '../../middleware/admin-auth';
import * as svc from './admin-restaurants.service';

export const adminRestaurantsRouter = Router();

adminRestaurantsRouter.get('/', async (req, res) => {
  const query = parseQuery(adminRestaurantListQuerySchema, req);
  res.json({ data: await svc.listAdminRestaurants(query) });
});

adminRestaurantsRouter.post('/', async (req, res) => {
  const input = parseBody(restaurantCreateSchema, req);
  res.status(201).json({ data: await svc.createRestaurant(input, req.admin!.id) });
});

adminRestaurantsRouter.get('/:id', async (req, res) => {
  res.json({ data: await svc.getAdminRestaurant(requireParam(req, 'id')) });
});

adminRestaurantsRouter.patch('/:id', async (req, res) => {
  const input = parseBody(restaurantUpdateSchema, req);
  res.json({ data: await svc.updateRestaurant(requireParam(req, 'id'), input, req.admin!.id) });
});

// Partner-submission decisions. Same gate as all restaurant management.
adminRestaurantsRouter.post('/:id/approve', async (req, res) => {
  res.json({ data: await svc.approveSubmission(requireParam(req, 'id'), req.admin!.id) });
});

adminRestaurantsRouter.post('/:id/reject', async (req, res) => {
  const { reason } = parseBody(submissionRejectSchema, req);
  res.json({ data: await svc.rejectSubmission(requireParam(req, 'id'), reason, req.admin!.id) });
});

// Deleting a restaurant is a superadmin-only, soft (archive) operation.
adminRestaurantsRouter.delete('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  await svc.softDeleteRestaurant(requireParam(req, 'id'), req.admin!.id);
  res.status(204).end();
});

adminRestaurantsRouter.put('/:id/hours', async (req, res) => {
  const input = parseBody(hoursUpsertSchema, req);
  res.json({ data: await svc.replaceHours(requireParam(req, 'id'), input, req.admin!.id) });
});

adminRestaurantsRouter.put('/:id/menu', async (req, res) => {
  const input = parseBody(menuUpsertSchema, req);
  res.json({ data: await svc.replaceMenu(requireParam(req, 'id'), input, req.admin!.id) });
});

adminRestaurantsRouter.post('/:id/images', async (req, res) => {
  const input = parseBody(imageCreateSchema, req);
  res.status(201).json({ data: await svc.addImage(requireParam(req, 'id'), input, req.admin!.id) });
});

adminRestaurantsRouter.put('/:id/images/reorder', async (req, res) => {
  const input = parseBody(imageReorderSchema, req);
  res.json({ data: await svc.reorderImages(requireParam(req, 'id'), input.ids, req.admin!.id) });
});

adminRestaurantsRouter.patch('/:id/images/:imageId', async (req, res) => {
  const input = parseBody(imageUpdateSchema, req);
  res.json({
    data: await svc.updateImage(
      requireParam(req, 'id'),
      requireParam(req, 'imageId'),
      input,
      req.admin!.id,
    ),
  });
});

adminRestaurantsRouter.delete('/:id/images/:imageId', async (req, res) => {
  res.json({
    data: await svc.deleteImage(
      requireParam(req, 'id'),
      requireParam(req, 'imageId'),
      req.admin!.id,
    ),
  });
});
