import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { Providers } from './app/Providers';
import { initAnalytics } from './lib/analytics';
import { router } from './router';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);

// Privacy-first, opt-in, DNT-respecting — a no-op unless VITE_ANALYTICS_DOMAIN is set.
initAnalytics();
