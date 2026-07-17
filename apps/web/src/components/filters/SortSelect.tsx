import { SORT_OPTIONS, type SortOption } from '@ku-food-hunt/shared';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const SORT_LABELS: Record<SortOption, string> = {
  rating: 'Highest rated',
  closest: 'Closest',
  reviews: 'Most reviewed',
  cheapest: 'Cheapest',
  newest: 'Newly added',
};

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="min-w-[9.5rem]" aria-label="Sort restaurants">
        <span className="text-muted">Sort:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
