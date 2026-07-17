import { Compass, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useHome } from '../api/queries';
import { CardGridSkeleton } from '../components/feedback/CardSkeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { Section } from '../components/layout/Section';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { JsonLd, Seo } from '../components/seo/Seo';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { websiteJsonLd } from '../lib/structured-data';

export default function Landing() {
  const { data, isPending, isError, error, refetch } = useHome();

  return (
    <>
      <Seo path="/" />
      <JsonLd data={websiteJsonLd()} />
      <Hero
        headline={data?.hero?.headline ?? 'Every great bite around KU.'}
        subheadline={
          data?.hero?.subheadline ??
          'Menus, prices, and honest student reviews for every restaurant near Kathmandu University.'
        }
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} className="my-8" />
        ) : (
          <>
            <Section
              title="Featured"
              subtitle="Student-loved spots, hand-picked by the team"
              seeAllHref="/explore"
            >
              {isPending ? (
                <CardGridSkeleton count={3} />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.featured.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Browse by category" className="border-t border-border">
              {isPending ? (
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="h-10 w-28 animate-shimmer rounded-full bg-surface-2" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {data.categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/categories/${c.slug}`}
                      className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2"
                    >
                      {c.name}
                      <span className="text-muted">{c.restaurantCount}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Recently added"
              subtitle="Fresh finds around Dhulikhel"
              className="border-t border-border"
            >
              {isPending ? (
                <CardGridSkeleton count={3} />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.recentlyAdded.slice(0, 3).map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      <WhySection />
      <CTASection />
    </>
  );
}

function CTASection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-sheet border border-border bg-surface px-6 py-12 text-center shadow-soft sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(50% 80% at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent)',
            }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Hungry? Your next favorite spot is a tap away.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
              Browse the full list, filter by craving, and get directions — no sign-up, no fuss.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/explore">
                  <Compass />
                  Explore restaurants
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/map">
                  <MapIcon />
                  Open the map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero({ headline, subheadline }: { headline: string; subheadline: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 60% at 20% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent), radial-gradient(50% 50% at 90% 20%, color-mix(in srgb, var(--honey) 22%, transparent), transparent)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-6 sm:py-28">
        <Badge variant="primary" className="mb-5">
          Kathmandu University · Dhulikhel
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {headline}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">{subheadline}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/explore">
              <Compass />
              Explore restaurants
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/map">
              <MapIcon />
              View map
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const items = [
    {
      title: 'Real menus & prices',
      body: 'Actual dishes and NPR prices, kept current by our team.',
    },
    {
      title: 'Honest student reviews',
      body: 'Ratings and photos from students who actually eat there.',
    },
    { title: 'One-tap navigation', body: 'Open any spot straight in Google Maps, turn-by-turn.' },
  ];
  return (
    <section className="border-t border-border bg-surface-2/40">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {items.map((item) => (
          <div key={item.title}>
            <div className="mb-3 h-1 w-10 rounded-full bg-primary" />
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
