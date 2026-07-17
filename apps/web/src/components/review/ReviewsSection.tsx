import type { RestaurantDetailDto } from '@ku-food-hunt/shared';
import { MessageSquarePlus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useReviews } from '../../api/queries';
import { EmptyState } from '../feedback/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { ImageLightbox, useLightbox } from '../restaurant/ImageLightbox';
import { DetailSection } from '../restaurant/RestaurantGallery';
import { ReviewCard } from './ReviewCard';
import { ReviewSummary } from './ReviewSummary';
import { StudentPhotoStrip } from './StudentPhotoStrip';
import { WriteReviewDialog } from './WriteReviewDialog';

type ReviewSort = 'recent' | 'top' | 'helpful';

const SORT_LABELS: Record<ReviewSort, string> = {
  recent: 'Most recent',
  top: 'Highest rated',
  helpful: 'Most helpful',
};

export function ReviewsSection({ restaurant }: { restaurant: RestaurantDetailDto }) {
  const [sort, setSort] = useState<ReviewSort>('recent');
  const { data, isPending } = useReviews(restaurant.slug, { sort, perPage: 20 });
  const lightbox = useLightbox();

  const reviews = data?.data ?? [];
  const photos = useMemo(
    () =>
      (data?.data ?? []).flatMap((r) =>
        r.images.map((img) => ({ url: img.url, alt: 'Student photo' })),
      ),
    [data],
  );

  const openPhoto = (url: string) => {
    const idx = photos.findIndex((p) => p.url === url);
    lightbox.openAt(idx >= 0 ? idx : 0);
  };

  return (
    <DetailSection
      id="reviews"
      title="Reviews"
      action={<WriteReviewDialog slug={restaurant.slug} restaurantName={restaurant.name} />}
    >
      <ReviewSummary
        avgRating={restaurant.avgRating}
        reviewCount={restaurant.reviewCount}
        distribution={restaurant.ratingDistribution}
      />

      {photos.length > 0 && <StudentPhotoStrip photos={photos} onPhotoClick={openPhoto} />}

      <div className="mt-8">
        {restaurant.reviewCount > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">
              {restaurant.reviewCount} {restaurant.reviewCount === 1 ? 'review' : 'reviews'}
            </h3>
            <Select value={sort} onValueChange={(v) => setSort(v as ReviewSort)}>
              <SelectTrigger className="h-9" aria-label="Sort reviews">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as ReviewSort[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isPending ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title="No reviews yet"
            description="Been here? Be the first KU student to share what you thought."
          />
        ) : (
          <div>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onPhotoClick={openPhoto} />
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        images={photos}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
        open={lightbox.open}
        onOpenChange={lightbox.onOpenChange}
      />
    </DetailSection>
  );
}
