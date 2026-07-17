import { Clock } from 'lucide-react';

import { useCategories } from '../../api/queries';
import { cn } from '../../lib/cn';

interface MapFilterBarProps {
  activeCategory: string | null;
  openOnly: boolean;
  onCategoryChange: (slug: string | null) => void;
  onOpenOnlyChange: (value: boolean) => void;
}

export function MapFilterBar({
  activeCategory,
  openOnly,
  onCategoryChange,
  onOpenOnlyChange,
}: MapFilterBarProps) {
  const { data: categories } = useCategories();

  return (
    <div className="pointer-events-auto flex gap-2 overflow-x-auto rounded-full border border-border bg-surface/90 p-1.5 shadow-lift backdrop-blur">
      <Chip active={openOnly} onClick={() => onOpenOnlyChange(!openOnly)}>
        <Clock className="size-3.5" />
        Open now
      </Chip>
      <span className="my-1 w-px shrink-0 bg-border" />
      <Chip active={activeCategory === null} onClick={() => onCategoryChange(null)}>
        All
      </Chip>
      {categories?.map((c) => (
        <Chip
          key={c.slug}
          active={activeCategory === c.slug}
          onClick={() => onCategoryChange(activeCategory === c.slug ? null : c.slug)}
        >
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-primary-strong text-primary-foreground' : 'text-foreground hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
