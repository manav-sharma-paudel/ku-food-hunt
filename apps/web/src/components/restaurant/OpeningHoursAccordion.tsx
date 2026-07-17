import { formatMinutes, getNepalClock, type OpeningHourDto } from '@ku-food-hunt/shared';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../lib/cn';
import { openStatus } from './open-status';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function slotsForDay(hours: OpeningHourDto[], day: number): string {
  const slots = hours.filter((h) => h.dayOfWeek === day).sort((a, b) => a.opensAt - b.opensAt);
  if (slots.length === 0) return 'Closed';
  return slots.map((s) => `${formatMinutes(s.opensAt)} – ${formatMinutes(s.closesAt)}`).join(', ');
}

export function OpeningHoursAccordion({ hours }: { hours: OpeningHourDto[] }) {
  const [expanded, setExpanded] = useState(false);
  const today = getNepalClock().dayOfWeek;
  const todayHours = hours.filter((h) => h.dayOfWeek === today);
  const status = openStatus(
    todayHours.map((h) => ({ dayOfWeek: h.dayOfWeek, opensAt: h.opensAt, closesAt: h.closesAt })),
    false,
  );

  return (
    <div className="rounded-xl border border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm">
          <span className={cn('font-medium', status.open ? 'text-basil' : 'text-danger')}>
            {status.open ? 'Open now' : 'Closed'}
          </span>
          <span className="text-muted">· Today {slotsForDay(hours, today)}</span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <ul className="border-t border-border px-4 py-2">
          {DAY_NAMES.map((name, day) => (
            <li
              key={name}
              className={cn(
                'flex justify-between py-1.5 text-sm',
                day === today ? 'font-medium text-foreground' : 'text-muted',
              )}
            >
              <span>{name}</span>
              <span className="tabular-nums">{slotsForDay(hours, day)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
