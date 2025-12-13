import { ConvexClientProvider } from '@/lib/convex/ConvexClientProvider';
import { ReactNode } from 'react';

export default function AppBuildLayout({ children }: { children: ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
