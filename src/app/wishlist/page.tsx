'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Start adding items to your wishlist by clicking the heart icon on products you love.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              {item.image && (
                <Link href={`/product/${item.id}`}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={250}
                    height={200}
                    className="product-image-card product-image cursor-pointer"
                  />
                </Link>
              )}
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <Link href={`/product/${item.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {item.title}
                </h3>
              </Link>
              <div className="flex justify-between items-center">
                <p className="text-green-600 dark:text-green-400 font-bold">
                  {item.price}
                </p>
                {item.condition && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.condition}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
