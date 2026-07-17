import { Router } from 'express';

import { requestFingerprint, saltedHash } from '../../lib/hash';
import { requireParam } from '../../lib/http';
import { voteLimiter } from '../../middleware/rate-limit';
import { toggleHelpful } from './reviews.service';

export const reviewsRouter = Router();

/** Toggle an anonymous helpful vote. The voter is a salted fingerprint, not an account. */
reviewsRouter.post('/:id/helpful', voteLimiter, async (req, res) => {
  const { ipHash, userAgentHash } = requestFingerprint(req);
  const voterHash = saltedHash(`${ipHash}:${userAgentHash}`);
  const result = await toggleHelpful(requireParam(req, 'id'), voterHash);
  res.json({ data: result });
});
