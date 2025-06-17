'use client';

import { WishlistProvider } from '@/contexts/WishlistContext';

export function WishlistProviderWrapper({ children }: { children: React.ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}
