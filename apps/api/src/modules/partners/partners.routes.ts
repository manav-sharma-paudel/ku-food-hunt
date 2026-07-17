import { partnerSubmissionSchema } from '@ku-food-hunt/shared';
import { Router } from 'express';

import { parseBody, requireParam } from '../../lib/http';
import { verifyTurnstile } from '../../lib/turnstile';
import {
  assertPhotoSignature,
  restaurantPhotoUpload,
  translateUploadError,
} from '../../lib/uploads';
import { HttpError } from '../../middleware/error-handler';
import { submissionLimiter, voteLimiter, writeLimiter } from '../../middleware/rate-limit';
import { getSubmissionByToken, submitPartnerRestaurant } from './partners.service';

export const partnersRouter = Router();

/**
 * Public restaurant onboarding — no login. Abuse is blunted the same way as
 * anonymous reviews: schema honeypot + tight rate limit + optional Turnstile,
 * and nothing goes live until an admin approves it.
 */
partnersRouter.post('/submissions', submissionLimiter, async (req, res) => {
  const input = parseBody(partnerSubmissionSchema, req);

  const passed = await verifyTurnstile(input.turnstileToken, req.ip ?? 'unknown');
  if (!passed) {
    throw new HttpError(403, 'TURNSTILE_FAILED', 'Human verification failed. Please try again.');
  }

  const result = await submitPartnerRestaurant(input);
  res.status(201).json({
    data: { name: result.name, isResubmission: result.isResubmission },
  });
});

/** Prefill for the emailed edit link (`/partners?token=…`). */
partnersRouter.get('/submissions/:token', voteLimiter, async (req, res) => {
  res.json({ data: await getSubmissionByToken(requireParam(req, 'token')) });
});

/** Photo upload for the form; same pipeline and limits as admin restaurant photos. */
partnersRouter.post('/photo', writeLimiter, (req, res, next) => {
  restaurantPhotoUpload.single('photo')(req, res, (err: unknown) => {
    if (err) return next(translateUploadError(err));
    const file = req.file;
    if (!file) return next(new HttpError(400, 'VALIDATION_ERROR', 'No photo was uploaded.'));
    assertPhotoSignature(file)
      .then(() => res.status(201).json({ data: { url: `/uploads/restaurants/${file.filename}` } }))
      .catch(next);
  });
});
