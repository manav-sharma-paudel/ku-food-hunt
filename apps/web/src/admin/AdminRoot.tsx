import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { Spinner } from '../components/ui/spinner';
import { AdminAuthProvider } from './AdminAuthContext';

const Fallback = (
  <div className="grid min-h-dvh place-items-center bg-background">
    <Spinner className="size-6 text-primary" />
  </div>
);

/** Root of the /admin branch: provides the auth context and a Suspense boundary. */
export function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={Fallback}>
        <Outlet />
      </Suspense>
    </AdminAuthProvider>
  );
}
