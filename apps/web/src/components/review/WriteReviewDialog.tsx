import {
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  REVIEW_MAX_PHOTOS,
  REVIEW_NAME_MAX,
} from '@ku-food-hunt/shared';
import { Camera, CheckCircle2, ImagePlus, Loader2, PenLine, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { ApiError } from '../../api/client';
import { useCreateReview, useUploadReviewPhoto } from '../../api/queries';
import { cn } from '../../lib/cn';
import { SmartImage } from '../feedback/SmartImage';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';
const RATING_LABELS = ['Terrible', 'Not great', 'Okay', 'Good', 'Excellent'];

interface WriteReviewDialogProps {
  slug: string;
  restaurantName: string;
}

export function WriteReviewDialog({ slug, restaurantName }: WriteReviewDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <PenLine />
        Write a review
      </Button>
      <DialogContent className="max-w-lg">
        {/* Remounting on each open resets the form cleanly. */}
        {open && (
          <ReviewForm slug={slug} restaurantName={restaurantName} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  slug,
  restaurantName,
  onClose,
}: {
  slug: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const createReview = useCreateReview(slug);
  const uploadPhoto = useUploadReviewPhoto();

  const bodyLength = body.trim().length;
  const canSubmit =
    rating >= 1 && bodyLength >= REVIEW_BODY_MIN && uploading === 0 && !createReview.isPending;
  const roomForPhotos = REVIEW_MAX_PHOTOS - photos.length - uploading;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-picking the same file
    setError(null);

    for (const file of files.slice(0, REVIEW_MAX_PHOTOS - photos.length - uploading)) {
      if (file.size > MAX_PHOTO_BYTES) {
        setError('Each photo must be under 4 MB.');
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const { url } = await uploadPhoto.mutateAsync(file);
        setPhotos((prev) => [...prev, url]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'That photo could not be uploaded.');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await createReview.mutateAsync({
        rating,
        body: body.trim(),
        authorName: name.trim() || undefined,
        imageUrls: photos.length ? photos : undefined,
        website: website || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post your review. Try again.');
    }
  }

  if (done) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-basil/10 text-basil">
          <CheckCircle2 className="size-8" />
        </div>
        <DialogTitle className="text-xl font-semibold">Thanks for sharing!</DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Your review is live. It’ll help the next KU student decide where to eat.
        </DialogDescription>
        <Button className="mt-6 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[85vh] flex-col">
      <div className="border-b border-border px-6 py-4">
        <DialogTitle className="text-lg font-semibold">Write a review</DialogTitle>
        <DialogDescription className="mt-0.5 text-sm text-muted">
          Sharing your take on {restaurantName}. No account needed — it’s anonymous.
        </DialogDescription>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* Rating */}
        <div>
          <label className="mb-2 block text-sm font-medium">Your rating</label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="review-body" className="mb-2 block text-sm font-medium">
            Your review
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, REVIEW_BODY_MAX))}
            rows={4}
            placeholder="What did you order? How was the taste, price, and vibe?"
            className="w-full resize-y rounded-btn border border-border bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>
              {bodyLength < REVIEW_BODY_MIN ? `At least ${REVIEW_BODY_MIN} characters` : ''}
            </span>
            <span className="tabular-nums">
              {body.length}/{REVIEW_BODY_MAX}
            </span>
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Photos <span className="font-normal text-muted">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((url) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-lg">
                <SmartImage
                  src={url}
                  alt="Your review photo"
                  ratio="1/1"
                  containerClassName="size-20"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((u) => u !== url))}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  aria-label="Remove photo"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <div
                key={`up-${i}`}
                className="flex size-20 items-center justify-center rounded-lg border border-border bg-surface-2"
              >
                <Loader2 className="size-5 animate-spin text-muted" />
              </div>
            ))}
            {roomForPhotos > 0 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition-colors hover:border-primary hover:text-primary-strong"
              >
                {photos.length === 0 ? (
                  <Camera className="size-5" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                <span className="text-[11px]">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>

        {/* Name (optional) */}
        <div>
          <label htmlFor="review-name" className="mb-2 block text-sm font-medium">
            Display name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, REVIEW_NAME_MAX))}
            placeholder="KU Student"
            className="w-full rounded-btn border border-border bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-surface"
          />
        </div>

        {/* Honeypot — hidden from real users, catches bots. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="review-website">Website</label>
          <input
            id="review-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {createReview.isPending && <Loader2 className="animate-spin" />}
          Post review
        </Button>
      </div>
    </form>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} — ${RATING_LABELS[n - 1]}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="-m-0.5 rounded-md p-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Star
              className={cn(
                'size-9 transition-colors',
                n <= active ? 'fill-honey text-honey' : 'fill-transparent text-border',
              )}
            />
          </button>
        ))}
      </div>
      <span className="w-20 text-sm font-medium text-muted">
        {active ? RATING_LABELS[active - 1] : ''}
      </span>
    </div>
  );
}
