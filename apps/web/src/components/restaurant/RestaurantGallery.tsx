import type { RestaurantImageDto } from '@ku-food-hunt/shared';

import { cn } from '../../lib/cn';
import { SmartImage } from '../feedback/SmartImage';
import { ImageLightbox, useLightbox } from './ImageLightbox';

/** Photo strip that opens a fullscreen lightbox. Cover + gallery images (menu scans excluded). */
export function RestaurantGallery({ images }: { images: RestaurantImageDto[] }) {
  const photos = images.filter((i) => i.type === 'COVER' || i.type === 'GALLERY');
  const lightbox = useLightbox();

  // The cover already appears in the header, so the strip previews the rest.
  const strip = photos.slice(1);
  if (strip.length === 0) return null;

  const shown = strip.slice(0, 5);
  const extra = strip.length - shown.length;

  return (
    <section aria-label="Photos" className="mx-auto max-w-[1000px] px-4 pt-6 sm:px-6">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {shown.map((img, i) => (
          <button
            key={img.id}
            onClick={() => lightbox.openAt(i + 1)}
            className="group relative overflow-hidden rounded-xl focus-visible:outline-none"
          >
            <SmartImage
              src={img.url}
              alt={img.alt}
              ratio="1/1"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            {i === shown.length - 1 && extra > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                +{extra} photos
              </span>
            )}
          </button>
        ))}
      </div>

      <ImageLightbox
        images={photos.map((p) => ({ url: p.url, alt: p.alt }))}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
        open={lightbox.open}
        onOpenChange={lightbox.onOpenChange}
      />
    </section>
  );
}

/** Section title + surface wrapper used by every detail section below the header. */
export function DetailSection({
  id,
  title,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-32 py-8', className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
