import { Router } from 'express';

import {
  assertPhotoSignature,
  restaurantPhotoUpload,
  translateUploadError,
} from '../../lib/uploads';
import { HttpError } from '../../middleware/error-handler';

export const adminUploadsRouter = Router();

/** Accept a single restaurant photo (cover/gallery/menu scan) and return its URL. */
adminUploadsRouter.post('/restaurant-photo', (req, res, next) => {
  restaurantPhotoUpload.single('photo')(req, res, (err: unknown) => {
    if (err) return next(translateUploadError(err));
    const file = req.file;
    if (!file) return next(new HttpError(400, 'VALIDATION_ERROR', 'No photo was uploaded.'));
    assertPhotoSignature(file)
      .then(() => res.status(201).json({ data: { url: `/uploads/restaurants/${file.filename}` } }))
      .catch(next);
  });
});
