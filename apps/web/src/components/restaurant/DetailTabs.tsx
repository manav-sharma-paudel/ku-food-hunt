import { cn } from '../../lib/cn';
import { useScrollSpy } from '../../hooks/useScrollSpy';

export interface DetailTab {
  id: string;
  label: string;
}

export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const active = useScrollSpy(tabs.map((t) => t.id));

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }

  return (
    <nav
      className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
      aria-label="Sections"
    >
      <div className="mx-auto flex max-w-[1000px] gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            onClick={(e) => handleClick(e, tab.id)}
            className={cn(
              'relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors',
              active === tab.id ? 'text-primary-strong' : 'text-muted hover:text-foreground',
            )}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
