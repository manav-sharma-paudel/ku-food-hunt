import { z } from 'zod';

import { PRICE_BANDS, SORT_OPTIONS } from '../constants';

export const priceBandSchema = z.enum(PRICE_BANDS);
export const sortOptionSchema = z.enum(SORT_OPTIONS);

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
