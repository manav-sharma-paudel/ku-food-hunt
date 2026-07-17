import type { AdminUserDto } from '@ku-food-hunt/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { setCsrfToken } from './api/adminClient';
import { adminEndpoints } from './api/adminEndpoints';

type AuthStatus = 'loading' | 'authed' | 'anon';

interface AdminAuthValue {
  admin: AdminUserDto | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);
const ME_KEY = ['admin', 'me'] as const;

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: adminEndpoints.me,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Keep the client's CSRF token in step with the current session.
  useEffect(() => {
    setCsrfToken(meQuery.data?.csrfToken ?? null);
  }, [meQuery.data?.csrfToken]);

  const login = async (email: string, password: string) => {
    const session = await adminEndpoints.login({ email, password });
    setCsrfToken(session.csrfToken);
    queryClient.setQueryData(ME_KEY, session);
  };

  const logout = async () => {
    await adminEndpoints.logout().catch(() => {});
    setCsrfToken(null);
    queryClient.setQueryData(ME_KEY, null);
    queryClient.removeQueries({ queryKey: ['admin'], predicate: (q) => q.queryKey[1] !== 'me' });
  };

  const status: AuthStatus = meQuery.isPending ? 'loading' : meQuery.data ? 'authed' : 'anon';

  return (
    <AdminAuthContext.Provider
      value={{ admin: meQuery.data?.admin ?? null, status, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
