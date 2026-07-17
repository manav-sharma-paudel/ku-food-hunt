import { Router } from 'express';

import { assertPhotoSignature, reviewPhotoUpload, translateUploadError } from '../../lib/uploads';
import { HttpError } from '../../middleware/error-handler';
import { writeLimiter } from '../../middleware/rate-limit';

export const uploadsRouter = Router();

/** Accept a single review photo, store it locally, and return its served URL. */
uploadsRouter.post('/review-photo', writeLimiter, (req, res, next) => {
  reviewPhotoUpload.single('photo')(req, res, (err: unknown) => {
    if (err) return next(translateUploadError(err));
    const file = req.file;
    if (!file) return next(new HttpError(400, 'VALIDATION_ERROR', 'No photo was uploaded.'));
    assertPhotoSignature(file)
      .then(() => res.status(201).json({ data: { url: `/uploads/reviews/${file.filename}` } }))
      .catch(next);
  });
});
