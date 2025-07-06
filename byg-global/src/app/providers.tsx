'use client';

import { SessionProvider } from 'next-auth/react';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AppProvider } from '@/contexts/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </AppProvider>
    </SessionProvider>
  );
}
