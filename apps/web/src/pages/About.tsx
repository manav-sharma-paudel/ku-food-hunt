import {
  Compass,
  HandHeart,
  MapPin,
  MessageSquareHeart,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router';

import { Seo } from '../components/seo/Seo';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const PRINCIPLES = [
  {
    icon: Utensils,
    title: 'Real menus & NPR prices',
    body: 'Every listing carries the actual dishes and current prices in rupees — kept up to date by our team, never scraped or guessed.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Honest student voices',
    body: 'Ratings, photos, and notes come from students who actually eat there. No account needed to read or write — just the truth about the food.',
  },
  {
    icon: MapPin,
    title: 'Built for the KU walk',
    body: 'Distances, open-now status, and directions are tuned for getting between classes in Dhulikhel — not a generic city-wide directory.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Reviews are anonymous and your location never leaves your device — it’s used in the browser to sort by distance, and nothing more.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Browse or search',
    body: 'Filter by category, price, rating, or distance — or search a craving like “momo” or “cold brew”.',
  },
  {
    n: '02',
    title: 'Check the details',
    body: 'Real menu, prices, opening hours, student reviews, and photos on one clean page.',
  },
  {
    n: '03',
    title: 'Go eat',
    body: 'One tap opens turn-by-turn directions in Google Maps. Come back and leave a review.',
  },
];

export default function About() {
  return (
    <>
      <Seo
        title="About"
        description="KU Food Hunt is a student-built food discovery platform for every restaurant, café, and tea shop around Kathmandu University in Dhulikhel."
        path="/about"
      />

      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(55% 55% at 15% 0%, color-mix(in srgb, var(--primary) 16%, transparent), transparent), radial-gradient(45% 45% at 90% 10%, color-mix(in srgb, var(--honey) 20%, transparent), transparent)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Badge variant="primary" className="mb-5">
            Kathmandu University · Dhulikhel
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Every great bite around KU, in one place.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            Finding good food near campus shouldn’t mean scrolling three apps and a group chat. KU
            Food Hunt is a single, honest map of where to eat around Kathmandu University — made by
            students who got tired of the guesswork.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6">
        <section className="border-b border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">What we stand for</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary-strong">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="rounded-card border border-border bg-surface p-5">
                <span className="text-sm font-semibold tabular-nums text-primary-strong">{n}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14">
          <div className="flex flex-col items-start gap-6 rounded-sheet border border-border bg-surface-2/40 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary-strong">
                <HandHeart className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Know a spot we’re missing?</h2>
                <p className="mt-1.5 max-w-md text-sm text-muted">
                  New tea shop by the gate? A hidden Newari kitchen? Tell us and we’ll get it on the
                  map — the directory grows with the community.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/explore">
                <Compass />
                Start exploring
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
