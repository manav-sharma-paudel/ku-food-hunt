import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface LightboxImage {
  url: string;
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const count = images.length;
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  const current = images[index];
  if (!current) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none"
          aria-label="Photo viewer"
          onTouchStart={(e) => (touchStartX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {current.alt || 'Photo'} ({index + 1} of {count})
          </DialogPrimitive.Title>

          <img
            src={current.url}
            alt={current.alt ?? ''}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain"
          />

          <DialogPrimitive.Close className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {count > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="size-6" />
              </button>
              <div className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-sm text-white tabular-nums">
                {index + 1} / {count}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Convenience hook: manages lightbox open state + current index. */
export function useLightbox() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return {
    open,
    index,
    setIndex,
    openAt: (i: number) => {
      setIndex(i);
      setOpen(true);
    },
    onOpenChange: setOpen,
  };
}
