import { googleMapsDirectionsUrl, type RestaurantDetailDto } from '@ku-food-hunt/shared';
import { Check, ExternalLink, Phone, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';

export function OpenInMapsButton({
  restaurant,
  className,
  size = 'default',
}: {
  restaurant: Pick<RestaurantDetailDto, 'latitude' | 'longitude' | 'googlePlaceId'>;
  className?: string;
  size?: 'default' | 'lg';
}) {
  return (
    <Button asChild className={className} size={size}>
      <a
        href={googleMapsDirectionsUrl(
          restaurant.latitude,
          restaurant.longitude,
          restaurant.googlePlaceId,
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink />
        Open in Google Maps
      </a>
    </Button>
  );
}

export function CallButton({ phone, className }: { phone: string; className?: string }) {
  return (
    <Button asChild variant="secondary" className={className}>
      <a href={`tel:${phone}`}>
        <Phone />
        Call
      </a>
    </Button>
  );
}

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user dismissed the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  return (
    <Button variant="secondary" onClick={share} className={className}>
      {copied ? <Check /> : <Share2 />}
      {copied ? 'Copied' : 'Share'}
    </Button>
  );
}
