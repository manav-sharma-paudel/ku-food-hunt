import {
  formatNpr,
  type MenuCategoryDto,
  type MenuItemDto,
  type RestaurantImageDto,
} from '@ku-food-hunt/shared';
import { Leaf, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '../feedback/EmptyState';
import { SmartImage } from '../feedback/SmartImage';
import { cn } from '../../lib/cn';
import { ImageLightbox, useLightbox } from './ImageLightbox';
import { DetailSection } from './RestaurantGallery';

interface MenuSectionProps {
  menuCategories: MenuCategoryDto[];
  menuScans: RestaurantImageDto[];
}

export function MenuSection({ menuCategories, menuScans }: MenuSectionProps) {
  const withItems = menuCategories.filter((c) => c.items.length > 0);
  const [activeId, setActiveId] = useState(withItems[0]?.id ?? '');

  // No transcribed items yet, but physical menu photographed → show scans.
  if (withItems.length === 0 && menuScans.length > 0) {
    return (
      <DetailSection id="menu" title="Menu">
        <MenuScans scans={menuScans} />
      </DetailSection>
    );
  }

  if (withItems.length === 0) {
    return (
      <DetailSection id="menu" title="Menu">
        <EmptyState
          icon={UtensilsCrossed}
          title="Menu coming soon"
          description="We’re still collecting this restaurant’s full menu. Check back shortly."
        />
      </DetailSection>
    );
  }

  const active = withItems.find((c) => c.id === activeId) ?? withItems[0];

  return (
    <DetailSection id="menu" title="Menu">
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {withItems.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              cat.id === active?.id
                ? 'border-primary bg-primary/10 text-primary-strong'
                : 'border-border hover:bg-surface-2',
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-muted">{cat.items.length}</span>
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border">
        {active?.items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>

      {menuScans.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-muted">Menu photos</h3>
          <MenuScans scans={menuScans} />
        </div>
      )}
    </DetailSection>
  );
}

function MenuItemRow({ item }: { item: MenuItemDto }) {
  return (
    <li className={cn('flex gap-4 py-4', !item.isAvailable && 'opacity-55')}>
      {item.imageUrl && (
        <SmartImage
          src={item.imageUrl}
          alt={item.name}
          ratio="1/1"
          containerClassName="size-16 shrink-0 rounded-xl"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{item.name}</span>
          {item.isVegetarian && <Leaf className="size-3.5 shrink-0 text-basil" />}
          {!item.isAvailable && <span className="text-xs text-muted">· Not available</span>}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.description}</p>
        )}
      </div>
      <span className="tabular shrink-0 font-medium">{formatNpr(item.priceNpr)}</span>
    </li>
  );
}

function MenuScans({ scans }: { scans: RestaurantImageDto[] }) {
  const lightbox = useLightbox();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {scans.map((scan, i) => (
          <button
            key={scan.id}
            onClick={() => lightbox.openAt(i)}
            className="overflow-hidden rounded-xl border border-border"
          >
            <SmartImage src={scan.url} alt={scan.alt} ratio="3/4" />
          </button>
        ))}
      </div>
      <ImageLightbox
        images={scans.map((s) => ({ url: s.url, alt: s.alt }))}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
        open={lightbox.open}
        onOpenChange={lightbox.onOpenChange}
      />
    </>
  );
}
