import {
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ScrollText,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { cn } from '../../lib/cn';
import { useAdminAuth } from '../AdminAuthContext';

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/restaurants', end: false, label: 'Restaurants', icon: UtensilsCrossed },
  { to: '/admin/reviews', end: false, label: 'Reviews', icon: MessageSquareText },
  { to: '/admin/homepage', end: false, label: 'Homepage', icon: Sparkles },
  { to: '/admin/audit', end: false, label: 'Activity', icon: ScrollText },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col border-b border-border bg-surface md:sticky md:top-0 md:h-dvh md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary-strong text-xs font-bold text-primary-foreground">
            KU
          </span>
          <span className="text-sm font-semibold">Admin console</span>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="ml-auto text-muted hover:text-danger md:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary-strong'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground',
                )
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-border px-4 py-3 md:block">
          <p className="truncate text-sm font-medium">{admin?.name}</p>
          <p className="truncate text-xs text-muted">{admin?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
