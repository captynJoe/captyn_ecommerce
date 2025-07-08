"use client";

import { useState, useEffect } from "react";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Filter, Grid3X3, List, Laptop, Smartphone, Gamepad2, Shield, Scissors, Cpu, LayoutGrid, Clock, TrendingUp } from "lucide-react";
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
  import type { User } from "firebase/auth";
  const [user, setUser] = useState<User | null>(null);
  const { isDark } = useApp();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [products, setProducts] = useState<EbayProduct[]>([]);
  const [personalizedProducts, setPersonalizedProducts] = useState<EbayProduct[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Added missing state variables for SliderMenu props
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [filterCondition, setFilterCondition] = useState("all");
  const [networkType, setNetworkType] = useState("all");

  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchProducts = async (resetProducts = false) => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = resetProducts ? 0 : pageNum;
      
      // Convert KSh to USD for API (approximate rate: 1 USD = 130 KSh)
      const USD_TO_KSH_RATE = 130;
      const minPriceUSD = priceRange.min > 0 ? Math.floor(priceRange.min / USD_TO_KSH_RATE) : undefined;
      const maxPriceUSD = priceRange.max > 0 ? Math.floor(priceRange.max / USD_TO_KSH_RATE) : undefined;
      
      // Build API URL with price range parameters
      const apiParams = new URLSearchParams({
        limit: '50',
        offset: (currentPage * 50).toString(),
        sortBy: sort,
        q: query || ""
      });
      
      if (minPriceUSD) {
        apiParams.append('minPrice', minPriceUSD.toString());
      }
      if (maxPriceUSD) {
        apiParams.append('maxPrice', maxPriceUSD.toString());
      }
      if (filterCondition && filterCondition !== 'all') {
        apiParams.append('condition', filterCondition);
      }
      
      const res = await fetch(`/api/products/ebay?${apiParams.toString()}`);
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
    // Only fetch products if there's a query (search term or category selected)
    if (query) {
      const resetProducts = pageNum === 0;
      fetchProducts(resetProducts);
    }
  }, [query, pageNum, sort, priceRange, filterCondition]);

  // Separate effect to handle search changes without dependency issues
  useEffect(() => {
    if (query) {
      setPageNum(0);
      fetchProducts(true);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user search history and personalized products
  useEffect(() => {
    if (user) {
      fetchUserSearchHistory();
    }
  }, [user]);

  const fetchUserSearchHistory = async () => {
    try {
      const response = await fetch('/api/user/search-history');
      if (response.ok) {
        const data = await response.json();
        setRecentSearches(data.searchHistory || []);
        
        // Fetch personalized products based on search history
        if (data.searchHistory && data.searchHistory.length > 0) {
          fetchPersonalizedProducts(data.searchHistory);
        }
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const fetchPersonalizedProducts = async (searchHistory: string[]) => {
    setPersonalizedLoading(true);
    try {
      // Use the most recent search terms to get personalized recommendations
      const recentTerms = searchHistory.slice(0, 3); // Get top 3 recent searches
      const combinedQuery = recentTerms.join(' ');
      
      const res = await fetch(`/api/products/ebay?q=${encodeURIComponent(combinedQuery)}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setPersonalizedProducts(data.itemSummaries || []);
      }
    } catch (error) {
      console.error("Error fetching personalized products:", error);
    } finally {
      setPersonalizedLoading(false);
    }
  };

  const saveSearchHistory = async (query: string) => {
    if (!session?.user || !query.trim()) return;
    
    try {
      await fetch('/api/user/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: query.trim(),
        }),
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const handleQuickSearch = (searchTerm: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchTerm);
    window.history.pushState({}, '', url.toString());
    
    setQuery(searchTerm);
    setPageNum(0);
    fetchProducts(true);
    saveSearchHistory(searchTerm);
  };

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

  // Determine if we're in search mode or started mode
  const isSearchMode = (query && query.trim().length > 0) || isStarted;

  return (
    <main className={`${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen`}>
        <Navbar
          onMenuOpenAction={() => setIsMenuOpen(true)}
          onSearchAction={(q: string) => {
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
    saveSearchHistory(q);
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
          networkType={networkType}
          setNetworkTypeAction={setNetworkType}
        />

        {/* Hero Section - Only show when not in search mode */}
        {!isSearchMode && (
          <section className={`${isDark ? "bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" : "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600"} text-white py-16 sm:py-20 md:py-24 relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full"></div>
            <div className="absolute top-32 right-20 w-16 h-16 border border-white rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-32 right-1/3 w-8 h-8 border border-white rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Trusted by 300+ Customers</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Ship Anything from the 
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> U.S. to Kenya </span>
              with Ease
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed">
              We make buying, shipping, and delivery simple, secure, and affordable. 
              From various sellers in the USA, we handle everything so you don't have to.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => {
                  // Set started mode to hide marketing content
                  setIsStarted(true);
                  // Scroll to Shop by Category section and set query to empty to show all
                  const shopSection = document.getElementById('shop-by-category');
                  if (shopSection) {
                    shopSection.scrollIntoView({ behavior: 'smooth' });
                  }
                  setQuery('');
                  setPageNum(0);
                  fetchProducts(true);
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Get Started Now
              </button>
              <Link href="/estimator-demo" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                Estimate Shipping
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
            
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>2-4 Week Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>M-Pesa Payments</span>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Shop by Category Section - Always visible and positioned high */}
        <section className={`max-w-7xl mx-auto px-4 ${isSearchMode ? 'py-4' : 'py-8'}`}>
          <div className="text-center mb-6">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Shop by Category
            </h2>
            <p className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Find exactly what you're looking for
            </p>
          </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
              {/* Phones */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'phone');
                  window.history.pushState({}, '', url.toString());
                  setQuery("phone");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-purple-900/30 group-hover:bg-purple-800/40" : "bg-purple-100 group-hover:bg-purple-200"
                }`}>
                  <Smartphone className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Phones
                </span>
              </button>

              {/* PCs & Laptops */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'laptop');
                  window.history.pushState({}, '', url.toString());
                  setQuery("laptop");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-blue-900/30 group-hover:bg-blue-800/40" : "bg-blue-100 group-hover:bg-blue-200"
                }`}>
                  <Laptop className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  PCs & Laptops
                </span>
              </button>

              {/* Gaming & Consoles */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'gaming console');
                  window.history.pushState({}, '', url.toString());
                  setQuery("gaming console");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-red-900/30 group-hover:bg-red-800/40" : "bg-red-100 group-hover:bg-red-200"
                }`}>
                  <Gamepad2 className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-red-400" : "text-red-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Gaming
                </span>
              </button>

              {/* Face & Beauty */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'beauty');
                  window.history.pushState({}, '', url.toString());
                  setQuery("beauty");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-pink-900/30 group-hover:bg-pink-800/40" : "bg-pink-100 group-hover:bg-pink-200"
                }`}>
                  <Scissors className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-pink-400" : "text-pink-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Beauty
                </span>
              </button>

              {/* Books & Novels */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'book');
                  window.history.pushState({}, '', url.toString());
                  setQuery("book");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-green-900/30 group-hover:bg-green-800/40" : "bg-green-100 group-hover:bg-green-200"
                }`}>
                  <ShoppingBag className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-green-400" : "text-green-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Books
                </span>
              </button>

              {/* Clothing */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'clothing');
                  window.history.pushState({}, '', url.toString());
                  setQuery("clothing");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-indigo-900/30 group-hover:bg-indigo-800/40" : "bg-indigo-100 group-hover:bg-indigo-200"
                }`}>
                  <Scissors className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Clothing
                </span>
              </button>

              {/* Security */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'security');
                  window.history.pushState({}, '', url.toString());
                  setQuery("security");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-orange-900/30 group-hover:bg-orange-800/40" : "bg-orange-100 group-hover:bg-orange-200"
                }`}>
                  <Shield className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Security
                </span>
              </button>

              {/* Electronics */}
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('q', 'electronics');
                  window.history.pushState({}, '', url.toString());
                  setQuery("electronics");
                  setPageNum(0);
                }}
                className={`group flex flex-col items-center p-2 md:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                    : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`p-1.5 md:p-3 rounded-full mb-1 md:mb-2 transition-colors ${
                  isDark ? "bg-yellow-900/30 group-hover:bg-yellow-800/40" : "bg-yellow-100 group-hover:bg-yellow-200"
                }`}>
                  <Star className={`w-4 h-4 md:w-6 md:h-6 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                </div>
                <span className={`text-xs font-medium text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Electronics
                </span>
              </button>
            </div>
        </section>

        {/* Marketing Content - Only show when not in search mode */}
        {!isSearchMode && (
          <>
            {/* How It Works Section */}
            <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                How It Works
              </h2>
              <p className={`text-lg sm:text-xl ${isDark ? "text-gray-400" : "text-gray-600"} max-w-3xl mx-auto`}>
                Four simple steps to get your favorite U.S. products delivered to Kenya
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className={`text-center p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Find Your Product
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Use our integrated search to discover U.S. products
                </p>
              </div>

              {/* Step 2 */}
              <div className={`text-center p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Estimate Shipping & Costs
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Use our price estimator to know the estimate shipping cost before you commit.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`text-center p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Place Your Order
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  We'll handle the buying, packaging, and safe delivery to Kenya. Sit back and relax.
                </p>
              </div>

              {/* Step 4 */}
              <div className={`text-center p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-xl">4</span>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Track & Receive
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Get regular updates and delivery within 2–3 weeks. Track your package every step of the way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Captyn Global */}
        <section className={`py-16 sm:py-20 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Why Choose Captyn Global?
              </h2>
              <p className={`text-lg sm:text-xl ${isDark ? "text-gray-400" : "text-gray-600"} max-w-3xl mx-auto`}>
                We're not just another shipping company. We're your trusted partner for U.S. shopping.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      All-in-One Platform
                    </h3>
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      No need to deal with multiple sites, forwarding services, or complicated processes. Everything you need in one place.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      No Hidden Fees
                    </h3>
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Lot's of veriried sellers, all with different prices, choose your prefered seller. 
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Fast, Safe Delivery
                    </h3>
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      From U.S. stores to your doorstep in Kenya within 2-4 weeks. Secure packaging and reliable tracking.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Local Payment Options
                    </h3>
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Pay conveniently via M-Pesa, PayPal, or bank transfer. No need for international credit cards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Testimonials */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                What Our Customers Say
              </h2>
              <p className={`text-lg sm:text-xl ${isDark ? "text-gray-400" : "text-gray-600"} max-w-3xl mx-auto`}>
                Join hundreds of satisfied customers who trust us with their U.S. shopping
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"} italic`}>
                  "Got my iPhone 15 Pro in 3 weeks — Phone was as indicated, came with protector too."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Alex Mwangi</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nairobi, Kenya</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"} italic`}>
                  "Finally a simple way to get products from the U.S. without getting scammed. Transparent pricing and excellent service!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Sarah Wanjiku</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Mombasa, Kenya</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"} italic`}>
                  "Ordered my MacBook and gaming setup through Captyn. Everything arrived perfectly packaged and on time. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">D</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Gerri Sifa</p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Ngara, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={`py-16 sm:py-20 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Frequently Asked Questions
              </h2>
              <p className={`text-lg sm:text-xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Everything you need to know about shipping from the U.S. to Kenya
              </p>
            </div>
            
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  How long does delivery take?
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Standard delivery takes 2-3 weeks from the time we receive your order. Express shipping options will be available soon at additional cost.
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  How are items packaged?
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  We use professional packaging materials including bubble wrap, foam padding, and sturdy boxes to ensure your items arrive safely. Fragile items receive extra protection.
                </p>
              </div>

          

              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  What if my item is damaged?
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  We offer full insurance on all shipments. If your item arrives damaged, we'll work with you to get a replacement or full refund. Unchecking the insurance box puts your product at risk of damage, so we recommend keeping it checked.
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border shadow-lg`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  How do I pay?
                </h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  We accept M-Pesa, PayPal, bank transfers, and major credit cards. Payment is required before we purchase your items from the U.S. store.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className={`py-16 sm:py-20 ${isDark ? "bg-gradient-to-r from-blue-900 to-purple-900" : "bg-gradient-to-r from-blue-600 to-purple-600"} text-white`}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Ship Your First Item?
            </h2>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Join thousands of satisfied customers and start shopping from the U.S. today. 
              No hidden fees, no complications, just simple and secure shipping.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  // Set started mode to hide marketing content
                  setIsStarted(true);
                  // Scroll to Shop by Category section and set query to empty to show all
                  const shopSection = document.getElementById('shop-by-category');
                  if (shopSection) {
                    shopSection.scrollIntoView({ behavior: 'smooth' });
                  }
                  setQuery('');
                  setPageNum(0);
                  fetchProducts(true);
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Get Started Now
              </button>
              <Link href="/estimator-demo" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                Calculate Shipping Cost
              </Link>
            </div>
          </div>
        </section>
          </>
        )}

        {/* Recent Searches - Only show for logged in users and not in search mode */}
        {user && recentSearches.length > 0 && !isSearchMode && (
          <section className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Searches</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 6).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                >
                  {search}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Personalized Recommendations - Only show for logged in users and not in search mode */} 
        {user && personalizedProducts.length > 0 && !isSearchMode && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">Based on your recent searches</span>
            </div>
            
            {personalizedLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {personalizedProducts.slice(0, 6).map((product, index) => (
                  <div 
                    key={`personalized-${product.itemId}-${index}`} 
                    className={`group ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}
                  >
                    <div className="relative aspect-square">
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
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      </Link>
                    </div>
                    
                    <div className="p-2 sm:p-3 md:p-4 flex flex-col justify-between flex-1">
                      <div>
                        <Link href={`/product/${product.itemId}`}>
                          <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
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
            )}
          </section>
        )}

        {/* Security Warning - Only show when security search is active */}
        {query && (query.toLowerCase().includes('security') || query.toLowerCase().includes('hacking') || query.toLowerCase().includes('rubber ducky') || query.toLowerCase().includes('penetration') || query.toLowerCase().includes('flipper') || query.toLowerCase().includes('proxmark')) && (
          <section className="max-w-7xl mx-auto px-4 py-4">
            <div className={`p-6 rounded-xl border-l-4 border-red-500 ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center mb-3">
                <Shield className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Security & Penetration Testing Tools</h3>
              </div>
              <div className="space-y-3 text-red-700 dark:text-red-300">
                <p>
                  <strong>⚠️ Legal Notice:</strong> We only ship security tools for legitimate purposes including:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Educational research and learning cybersecurity</li>
                  <li>Authorized penetration testing and security audits</li>
                  <li>Professional cybersecurity training and certification</li>
                  <li>Personal network security testing (your own devices)</li>
                </ul>
                <p className="text-sm">
                  <strong>Prohibited:</strong> Tools intended for unauthorized access, illegal activities, or malicious purposes. 
                  By purchasing, you confirm legitimate use and compliance with local laws.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Filter and View Controls - Only show when there are products or in search mode */}
        {(isSearchMode || products.length > 0) && (
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            ) : products.length === 0 && isSearchMode ? (
              <div className="text-center py-20">
                <div className={`inline-block p-8 rounded-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">Start your search or choose a category</h3>
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
        )}
    </main>
  );
}
