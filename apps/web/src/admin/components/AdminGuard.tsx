import { Navigate, Outlet } from 'react-router';

import { Spinner } from '../../components/ui/spinner';
import { useAdminAuth } from '../AdminAuthContext';

/** Blocks the admin area until a session is confirmed; bounces anon users to login. */
export function AdminGuard() {
  const { status } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }
  if (status === 'anon') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
