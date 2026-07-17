import { Link, useParams } from 'react-router';

import { ApiError } from '../api/client';
import { useRestaurant } from '../api/queries';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { DetailSkeleton } from '../components/restaurant/DetailSkeleton';
import { DetailTabs, type DetailTab } from '../components/restaurant/DetailTabs';
import { LocationSection } from '../components/restaurant/LocationSection';
import { MenuSection } from '../components/restaurant/MenuSection';
import { NearbyRestaurants } from '../components/restaurant/NearbyRestaurants';
import { OverviewSection } from '../components/restaurant/OverviewSection';
import { PopularDishes } from '../components/restaurant/PopularDishes';
import { RestaurantGallery } from '../components/restaurant/RestaurantGallery';
import { RestaurantHeader } from '../components/restaurant/RestaurantHeader';
import { StickyActionBar } from '../components/restaurant/StickyActionBar';
import { ReviewsSection } from '../components/review/ReviewsSection';
import { JsonLd, Seo } from '../components/seo/Seo';
import { Button } from '../components/ui/button';
import { restaurantBreadcrumbJsonLd, restaurantJsonLd } from '../lib/structured-data';

const TABS: DetailTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'menu', label: 'Menu' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'location', label: 'Location' },
];

export default function RestaurantDetail() {
  const { slug = '' } = useParams();
  const { data, isPending, isError, error, refetch } = useRestaurant(slug);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-[1000px] flex-1 items-center px-4 py-16">
        {notFound ? (
          <EmptyState
            title="Restaurant not found"
            description="This place may have moved or isn’t listed yet."
            action={
              <Button asChild>
                <Link to="/explore">Browse restaurants</Link>
              </Button>
            }
            className="mx-auto"
          />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} className="mx-auto" />
        )}
      </div>
    );
  }

  const menuScans = data.images.filter((i) => i.type === 'MENU_SCAN');
  const categoryNames = data.categories.map((c) => c.name).join(', ');
  const metaDescription = (
    data.description ??
    `${data.name}${categoryNames ? ` — ${categoryNames}` : ''} near Kathmandu University. See the menu, NPR prices, student reviews, and get directions.`
  ).slice(0, 160);

  return (
    <div className="pb-28 md:pb-0">
      <Seo
        title={data.name}
        description={metaDescription}
        path={`/restaurants/${data.slug}`}
        image={data.coverImageUrl}
        type="article"
      />
      <JsonLd data={restaurantJsonLd(data)} />
      <JsonLd data={restaurantBreadcrumbJsonLd(data)} />
      <RestaurantHeader restaurant={data} />
      <RestaurantGallery images={data.images} />

      <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
        <div className="mt-8">
          <DetailTabs tabs={TABS} />
        </div>

        <OverviewSection restaurant={data} />
        <PopularDishes dishes={data.popularDishes} />
        <MenuSection menuCategories={data.menuCategories} menuScans={menuScans} />
        <ReviewsSection restaurant={data} />
        <LocationSection restaurant={data} />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <NearbyRestaurants restaurants={data.nearby} />
      </div>

      <StickyActionBar restaurant={data} />
    </div>
  );
}
