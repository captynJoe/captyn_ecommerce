"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Filter, Grid3X3, List, Laptop, Smartphone, Gamepad2, Shield, Scissors, Cpu, LayoutGrid } from "lucide-react";
import Navbar from "@/components/navbar";
import SliderMenu from "@/components/SliderMenu";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useApp } from "@/contexts/AppContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { convertToKESWithProfitAndShipping } from "@/utils/pricing";

// Types
interface Seller {
  username: string;
  feedbackPercentage: number;
}

interface EbayProduct {
  itemId: string;
  title: string;
  price: { value: number; currency: string };
  seller?: Seller;
  image: { imageUrl: string };
  condition?: string;
}

// Main Page
export default function HomePage() {
  const { isDark } = useApp();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<EbayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [query, setQuery] = useState(() => {
    // Initialize from URL if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('q') || "";
    }
    return "";
  });
  const [pageNum, setPageNum] = useState(0);
  const [sort, setSort] = useState("newlyListed");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Added missing state variables for SliderMenu props
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [filterCondition, setFilterCondition] = useState("all");
  const [rating, setRating] = useState(0);
  const [networkType, setNetworkType] = useState("all");

  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (resetProducts = false) => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = resetProducts ? 0 : pageNum;
      const res = await fetch(
        `/api/products/ebay?limit=50&offset=${currentPage * 50}&sortBy=${sort}&q=${query || "smartphone"}`
      );
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      if (!data.itemSummaries || data.itemSummaries.length === 0) {
        console.warn('No itemSummaries in response:', data);
        setProducts(resetProducts || currentPage === 0 ? [] : products);
        return;
      }

      console.log('Fetched products:', data.itemSummaries.length);
      setProducts(prev => (resetProducts || currentPage === 0 ? data.itemSummaries : [...prev, ...data.itemSummaries]));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && products.length > 0) {
          console.log('Loading more products...');
          setPageNum(prev => prev + 1);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const loadingTrigger = document.getElementById('loading-trigger');
    if (loadingTrigger) {
      observer.observe(loadingTrigger);
    }

    return () => {
      if (loadingTrigger) {
        observer.unobserve(loadingTrigger);
      }
    };
  }, [loading, products.length]);

  useEffect(() => {
    const resetProducts = pageNum === 0;
    fetchProducts(resetProducts);
  }, [query, pageNum, sort]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlQuery = urlParams.get('q') || "";
      if (urlQuery !== query) {
        setQuery(urlQuery);
        setPageNum(0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [query]);

  // Initial load from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlQuery = urlParams.get('q') || "";
      if (urlQuery && urlQuery !== query) {
        setQuery(urlQuery);
        setPageNum(0);
      }
    }
  }, []);

  if (initialLoading) return <LoadingAnimation />;

  return (
    <main className={`${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen`}>
        <Navbar
          onMenuOpen={() => setIsMenuOpen(true)}
          onSearch={(q: string) => {
    // Update URL with search query
    const url = new URL(window.location.href);
    if (q) {
      url.searchParams.set('q', q);
    } else {
      url.searchParams.delete('q');
    }
    window.history.pushState({}, '', url.toString());
    
    setQuery(q);
    setPageNum(0);
    fetchProducts(true);
          }}
        />

        <SliderMenu
          isOpen={isMenuOpen}
          onCloseAction={() => setIsMenuOpen(false)}
          sortBy={sort}
          setSortByAction={(newSort) => {
            setSort(newSort);
            setPageNum(0);
          }}
          filterCondition={filterCondition}
          setFilterConditionAction={setFilterCondition}
          onFilterChangeAction={() => {
            setPageNum(0);
          }}
          priceRange={priceRange}
          setPriceRangeAction={setPriceRange}
          rating={rating}
          setRatingAction={setRating}
          networkType={networkType}
          setNetworkTypeAction={setNetworkType}
        />

        {/* Hero Section */}
        <section className={`${isDark ? "bg-gradient-to-r from-blue-900 to-purple-900" : "bg-gradient-to-r from-blue-600 to-purple-600"} text-white py-8 sm:py-12 md:py-16`}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 md:mb-4">
              Discover Amazing Products
            </h1>
            <p className="text-base sm:text-lg md:text-2xl mb-4 sm:mb-6 md:mb-8 opacity-90">
              Shop from millions of products with the best deals and quality
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>Top Rated Sellers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Icons Section */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Shop by Category
            </h2>
            <p className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Find exactly what you're looking for
            </p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6">
            {/* All */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('q');
                window.history.pushState({}, '', url.toString());
                setQuery("");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-gray-900/30 group-hover:bg-gray-800/40" : "bg-gray-100 group-hover:bg-gray-200"
              }`}>
                <LayoutGrid className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                All
              </span>
            </button>

            {/* Phones */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'smartphone');
                window.history.pushState({}, '', url.toString());
                setQuery("smartphone");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-purple-900/30 group-hover:bg-purple-800/40" : "bg-purple-100 group-hover:bg-purple-200"
              }`}>
                <Smartphone className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Phones
              </span>
            </button>

            {/* Gaming */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'playstation xbox nintendo');
                window.history.pushState({}, '', url.toString());
                setQuery("playstation xbox nintendo");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-red-900/30 group-hover:bg-red-800/40" : "bg-red-100 group-hover:bg-red-200"
              }`}>
                <Gamepad2 className={`w-6 h-6 ${isDark ? "text-red-400" : "text-red-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Gaming
              </span>
            </button>

            {/* Hair & Wigs */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'hair wigs');
                window.history.pushState({}, '', url.toString());
                setQuery("hair wigs");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-pink-900/30 group-hover:bg-pink-800/40" : "bg-pink-100 group-hover:bg-pink-200"
              }`}>
                <Scissors className={`w-6 h-6 ${isDark ? "text-pink-400" : "text-pink-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Hair & Wigs
              </span>
            </button>

            {/* Gaming PCs */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'gaming pc');
                window.history.pushState({}, '', url.toString());
                setQuery("gaming pc");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-blue-900/30 group-hover:bg-blue-800/40" : "bg-blue-100 group-hover:bg-blue-200"
              }`}>
                <Cpu className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Gaming PCs
              </span>
            </button>

            {/* Laptops */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'laptop');
                window.history.pushState({}, '', url.toString());
                setQuery("laptop");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-indigo-900/30 group-hover:bg-indigo-800/40" : "bg-indigo-100 group-hover:bg-indigo-200"
              }`}>
                <Laptop className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Laptops
              </span>
            </button>

            {/* Computer Parts */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'graphics card processor');
                window.history.pushState({}, '', url.toString());
                setQuery("graphics card processor");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-green-900/30 group-hover:bg-green-800/40" : "bg-green-100 group-hover:bg-green-200"
              }`}>
                <Cpu className={`w-6 h-6 ${isDark ? "text-green-400" : "text-green-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                PC Parts
              </span>
            </button>

            {/* Hacking Tools */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'rubber ducky hacking');
                window.history.pushState({}, '', url.toString());
                setQuery("rubber ducky hacking");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-orange-900/30 group-hover:bg-orange-800/40" : "bg-orange-100 group-hover:bg-orange-200"
              }`}>
                <Shield className={`w-6 h-6 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Security
              </span>
            </button>

            {/* Electronics */}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('q', 'electronics gadgets');
                window.history.pushState({}, '', url.toString());
                setQuery("electronics gadgets");
                setPageNum(0);
              }}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 transition-colors ${
                isDark ? "bg-yellow-900/30 group-hover:bg-yellow-800/40" : "bg-yellow-100 group-hover:bg-yellow-200"
              }`}>
                <Star className={`w-6 h-6 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
              </div>
              <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Electronics
              </span>
            </button>
          </div>
        </section>

        {/* Filter and View Controls */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isDark 
                    ? "border-gray-600 hover:bg-gray-800 text-white" 
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                    : isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                    : isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Products Grid/List */}
          {loading && pageNum === 0 ? (
            <div className="flex justify-center items-center py-20">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className={`inline-block p-8 rounded-xl ${isDark ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}>
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold mb-2 text-red-600">Something went wrong</h3>
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={() => fetchProducts()}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className={`inline-block p-8 rounded-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product, index) => (
                  <div 
                    key={`${product.itemId}-${index}`} 
                    className={`group ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 h-32' : 'aspect-square'}`}>
                      <button
                        onClick={() =>
                          isInWishlist(product.itemId)
                            ? removeFromWishlist(product.itemId)
                            : addToWishlist({
                                id: product.itemId,
                                title: product.title,
                                price: convertToKESWithProfitAndShipping(product.price.value.toString(), product.condition, product.title),
                                image: product.image?.imageUrl || '/placeholder-image.jpg',
                                condition: product.condition,
                              } as any)
                        }
                        className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all z-10 group-hover:scale-110"
                        title={isInWishlist(product.itemId) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                            isInWishlist(product.itemId) 
                              ? "fill-red-500 text-red-500" 
                              : "text-gray-600 hover:text-red-500"
                          }`}
                        />
                      </button>
                      <Link href={`/product/${product.itemId}`} className="block h-full relative">
                        <Image
                          src={product.image?.imageUrl || '/placeholder-image.jpg'}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes={viewMode === 'list' ? "192px" : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"}
                        />
                      </Link>
                    </div>
                    
                    <div className={`p-2 sm:p-3 md:p-4 flex flex-col justify-between ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div>
                        <Link href={`/product/${product.itemId}`}>
                          <h3 className={`font-semibold mb-1 sm:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors ${
                            viewMode === 'list' ? 'text-lg' : 'text-xs sm:text-sm'
                          }`}>
                            {product.title}
                          </h3>
                        </Link>
                        
                        {product.condition && (
                          <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full mb-1 sm:mb-2 ${
                            isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                          }`}>
                            {product.condition}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <div className="text-sm sm:text-lg md:text-xl font-bold text-green-600">
                            {convertToKESWithProfitAndShipping(product.price.value.toString(), product.condition, product.title)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Includes shipping to US
                          </div>
                        </div>
                        {product.seller && (
                          <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-500">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{product.seller.feedbackPercentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading Trigger for Infinite Scroll */}
              {products.length > 0 && (
                <div 
                  id="loading-trigger" 
                  className="text-center py-8 mt-4"
                  style={{ minHeight: '100px' }}
                >
                  <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {loading ? "Loading..." : "Scroll for more"}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
    </main>
  );
}
