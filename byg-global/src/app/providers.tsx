'use client';

import { WishlistProvider } from '@/contexts/WishlistContext';
import { AppProvider } from '@/contexts/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </AppProvider>
  );
}
