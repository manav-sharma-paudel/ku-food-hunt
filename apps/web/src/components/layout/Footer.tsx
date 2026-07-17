import { Link } from 'react-router';

const COLUMNS = [
  {
    heading: 'Discover',
    links: [
      { to: '/explore', label: 'All restaurants' },
      { to: '/map', label: 'Map' },
      { to: '/explore?sort=rating', label: 'Top rated' },
      { to: '/explore?open=true', label: 'Open now' },
    ],
  },
  {
    heading: 'Categories',
    links: [
      { to: '/categories/momo', label: 'Momo' },
      { to: '/categories/thakali', label: 'Thakali' },
      { to: '/categories/cafe', label: 'Cafés' },
      { to: '/categories/chiya', label: 'Chiya' },
    ],
  },
  {
    heading: 'About',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/about#faq', label: 'FAQ' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-footer text-footer-foreground">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                🍜
              </span>
              KU Food Hunt
            </div>
            <p className="mt-3 max-w-xs text-sm text-footer-muted">
              Every great bite around Kathmandu University — menus, prices, and honest student
              reviews.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-sm font-semibold">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-footer-muted transition-colors hover:text-footer-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-footer-muted sm:flex-row">
          <span>Made by KU students 🍜</span>
          <span>© {new Date().getFullYear()} KU Food Hunt · Dhulikhel</span>
        </div>
      </div>
    </footer>
  );
}
