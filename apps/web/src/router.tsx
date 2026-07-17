import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';

import { PageShell } from './components/layout/PageShell';
import { AdminRoot } from './admin/AdminRoot';
import { AdminGuard } from './admin/components/AdminGuard';
import { AdminLayout } from './admin/components/AdminLayout';
import { PartnerShell } from './partners/PartnerShell';

// Landing is eager (it's the entry route); the rest are lazy route chunks.
import Landing from './pages/Landing';

const Explore = lazy(() => import('./pages/Explore'));
const CategoryRedirect = lazy(() => import('./pages/CategoryRedirect'));
const MapPage = lazy(() => import('./pages/Map'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Partner onboarding is its own branch too — partners.<domain> serves the same
// bundle, so landing on that host's root simply rewrites to /partners.
const PartnerSubmit = lazy(() => import('./partners/PartnerSubmitPage'));
const PartnerSuccess = lazy(() => import('./partners/PartnerSuccessPage'));
if (window.location.hostname.startsWith('partners.') && window.location.pathname === '/') {
  window.history.replaceState(null, '', '/partners');
}

// Admin is a separate app branch (own layout, auth, and lazy chunk).
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AdminOverview = lazy(() => import('./admin/pages/AdminOverview'));
const AdminRestaurantList = lazy(() => import('./admin/pages/AdminRestaurantList'));
const AdminRestaurantEditor = lazy(() => import('./admin/pages/AdminRestaurantEditor'));
const AdminModeration = lazy(() => import('./admin/pages/AdminModeration'));
const AdminHomepage = lazy(() => import('./admin/pages/AdminHomepage'));
const AdminAudit = lazy(() => import('./admin/pages/AdminAudit'));

export const router = createBrowserRouter([
  {
    path: 'admin',
    element: <AdminRoot />,
    children: [
      { path: 'login', element: <AdminLogin /> },
      {
        element: <AdminGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminOverview /> },
              { path: 'restaurants', element: <AdminRestaurantList /> },
              { path: 'restaurants/new', element: <AdminRestaurantEditor /> },
              { path: 'restaurants/:id', element: <AdminRestaurantEditor /> },
              { path: 'reviews', element: <AdminModeration /> },
              { path: 'homepage', element: <AdminHomepage /> },
              { path: 'audit', element: <AdminAudit /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'partners',
    element: <PartnerShell />,
    children: [
      { index: true, element: <PartnerSubmit /> },
      { path: 'success', element: <PartnerSuccess /> },
    ],
  },
  {
    element: <PageShell />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'explore', element: <Explore /> },
      { path: 'categories/:slug', element: <CategoryRedirect /> },
      { path: 'map', element: <MapPage /> },
      { path: 'restaurants/:slug', element: <RestaurantDetail /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
