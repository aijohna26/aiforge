'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode, useMemo } from 'react';

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      console.warn('[Convex] NEXT_PUBLIC_CONVEX_URL not set, Convex features will not work');
      // Return a dummy client that won't connect
      return new ConvexReactClient('https://dummy.convex.cloud');
    }

    return new ConvexReactClient(convexUrl);
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
