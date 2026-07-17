import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

import { queryClient } from '../lib/query-client';
import { ThemeProvider } from '../lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* Honor the OS "reduce motion" setting across every animation, app-wide. */}
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
