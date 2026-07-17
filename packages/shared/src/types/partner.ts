import type { PriceBand } from '../constants';
import type { RestaurantStatusValue } from '../schemas/admin';

/** What the edit link (`/partners?token=…`) loads back into the form. */
export interface PartnerSubmissionDto {
  name: string;
  legalName: string | null;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  websiteUrl: string | null;
  categorySlugs: string[];
  priceBand: PriceBand;
  priceMinNpr: number | null;
  priceMaxNpr: number | null;
  hasQrPayment: boolean;
  hasDelivery: boolean;
  hasVegOptions: boolean;
  hours: { dayOfWeek: number; opensAt: number; closesAt: number }[];
  coverPhotoUrl: string | null;
  galleryPhotoUrls: string[];
  menuPhotoUrl: string | null;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  status: RestaurantStatusValue;
  rejectionReason: string | null;
}
