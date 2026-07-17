import { ImageOff } from 'lucide-react';
import { useState, type ImgHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  /** Container aspect ratio, e.g. "16/10" (cards) or "4/3" (gallery). Ignored when `fill`. */
  ratio?: string;
  /** Fill the parent's own dimensions instead of imposing an aspect ratio. */
  fill?: boolean;
  containerClassName?: string;
}

/**
 * Fixed-ratio image with a shimmering placeholder, a fade-in on load, and a
 * graceful fallback — no layout shift, lazy by default. Use `fill` for a hero
 * cover where the parent sets the height and the image should span full width
 * (avoids aspect-ratio shrinking the width under a max-height).
 */
export function SmartImage({
  src,
  alt,
  ratio = '16/10',
  fill = false,
  className,
  containerClassName,
  loading = 'lazy',
  ...props
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-2',
        fill && 'size-full',
        containerClassName,
      )}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {src && !failed ? (
        <>
          {!loaded && <div className="absolute inset-0 animate-shimmer bg-surface-2" aria-hidden />}
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              'relative size-full object-cover transition-opacity duration-500',
              loaded ? 'opacity-100' : 'opacity-0',
              className,
            )}
            {...props}
          />
        </>
      ) : (
        <div className="flex size-full items-center justify-center text-muted">
          <ImageOff className="size-8" aria-hidden />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
