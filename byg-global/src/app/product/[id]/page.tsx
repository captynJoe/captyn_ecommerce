"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, arrayUnion } from "firebase/firestore";
import { app } from "../../../utils/firebase";
import LoadingAnimation from "@/components/LoadingAnimation";
import LoginModal from "@/components/LoginModal";
import SliderMenu from "@/components/SliderMenu";
import { convertToKESWithProfitAndShipping, convertToKESWithProfitStorageAndShipping } from "@/utils/pricing";
import { useWishlist } from "@/contexts/WishlistContext";
import { useApp } from "@/contexts/AppContext";
import { Heart, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

interface EbayImage {
  imageUrl: string;
}

interface EbayItemDetail {
  title: string;
  itemId: string;
  price?: {
    value: string;
    currency: string;
  };
  seller?: {
    username: string;
  };
  condition?: string;
  itemWebUrl?: string;
  image?: EbayImage;
  additionalImages?: EbayImage[];
  itemSpecifics?: Record<string, string>;
  description?: string;
}

const USD_TO_KES = 130;

function convertToKES(value: string | undefined, currency: string | undefined) {
  if (!value) return "";
  const num = parseFloat(value);
  if (currency === "USD" || !currency) return `Ksh ${(num * USD_TO_KES).toLocaleString()}`;
  return `Ksh ${num.toLocaleString()}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDark } = useApp();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [item, setItem] = useState<EbayItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [buying, setBuying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState({
    storage: '',
    color: '',
    network: ''
  });

  // For swipeable images
  const [currentImage, setCurrentImage] = useState(0);
  
  // For product recommendations
  const [moreLikeThisProducts, setMoreLikeThisProducts] = useState<EbayItemDetail[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);


  // Handle configuration changes
  const handleConfigChange = (type: 'storage' | 'color' | 'network', value: string) => {
    setSelectedConfig(prev => ({
      ...prev,
      [type]: value
    }));
  };

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    async function fetchItem() {
      try {
        const res = await fetch(`/api/products/ebay/${encodeURIComponent(id as string)}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();

        if (!data.description) {
          try {
            const descRes = await fetch(`/api/products/ebay/${encodeURIComponent(id as string)}/description`);
            if (descRes.ok) {
              const descData = await descRes.json();
              data.description = descData.description;
            }
          } catch {}
        }

        setItem(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  // Fetch recommendations when item is loaded
  useEffect(() => {
    if (!item) return;

    async function fetchRecommendations() {
      setLoadingRecommendations(true);
      try {
        // Extract keywords from the current item for similar products
        const keywords = item?.title?.split(' ').slice(0, 3).join(' ') || 'phone'; // First 3 words
        
        // Fetch similar products
        const similarRes = await fetch(`/api/products/ebay?q=${encodeURIComponent(keywords)}&limit=8`);
        if (similarRes.ok) {
          const similarData = await similarRes.json();
          // Filter out the current item and set similar products
          const filteredSimilar = similarData.itemSummaries?.filter((p: EbayItemDetail) => p.itemId !== item?.itemId) || [];
          setMoreLikeThisProducts(filteredSimilar);
        }


      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    }

    fetchRecommendations();
  }, [item]);

  // Filter out unwanted details
  const shouldHideCondition = item?.condition === "Very Good - Refurbished";
  const shouldHideSeller = item?.seller?.username === "directauth";
  const shouldHideItemId = item?.itemId === "v1|355896536737|624955641491";
  const shouldHideDetails = shouldHideCondition && shouldHideSeller && shouldHideItemId;

  // Check if itemSpecifics is empty or "No specifics available."
  const hasSpecifics =
    item?.itemSpecifics &&
    Object.keys(item.itemSpecifics).length > 0 &&
    !(
      Object.keys(item.itemSpecifics).length === 1 &&
      Object.values(item.itemSpecifics)[0].toLowerCase().includes("no specifics available")
    );

  // Extract key specifics for display
  const model = item?.itemSpecifics?.Model || item?.itemSpecifics?.model || "";
  const network = item?.itemSpecifics?.Network || item?.itemSpecifics?.network || "";
  const lockStatus = item?.itemSpecifics?.["Lock Status"] || item?.itemSpecifics?.["lock status"] || "";
  const storageCapacity = item?.itemSpecifics?.["Storage Capacity"] || item?.itemSpecifics?.["storage capacity"] || "";

  // Handle login success
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  // Add to Cart
  const handleAddToCart = async () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = auth.currentUser;
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!item) return;
    const cartRef = doc(db, "carts", user.uid);
    await setDoc(
      cartRef,
      {
        items: arrayUnion({
          itemId: item.itemId,
          title: item.title,
          price: item.price,
          image: item.image?.imageUrl || '/placeholder-image.jpg',
          quantity: 1,
          addedAt: new Date().toISOString(),
          configuration: {
            storage: selectedConfig.storage || storageCapacity || '',
            color: selectedConfig.color || item.itemSpecifics?.Color || '',
            network: selectedConfig.network || network || ''
          }
        }),
      },
      { merge: true }
    );
    alert("Added to cart!");
  };

  // Buy Now: Add to cart and redirect to checkout
  const handleBuyNow = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      setShowLogin(true);
      return;
    }
    
    if (!item) {
      alert('Product information not available. Please try again.');
      return;
    }
    
    setBuying(true);
    try {
      const db = getFirestore(app);
      // Add item to cart
      const cartRef = doc(db, "carts", user.uid);
      await setDoc(
        cartRef,
        {
          items: arrayUnion({
            itemId: item.itemId,
            title: item.title,
            price: item.price,
            image: item.image?.imageUrl || '/placeholder-image.jpg',
            quantity: 1,
            addedAt: new Date().toISOString(),
            configuration: {
              storage: selectedConfig.storage || storageCapacity || '',
              color: selectedConfig.color || item.itemSpecifics?.Color || '',
              network: selectedConfig.network || network || ''
            }
          }),
        },
        { merge: true }
      );
      
      // Redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error during buy now:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setBuying(false);
    }
  };

  // Enhanced description filtering to remove unwanted content
  function filterDescription(html?: string) {
    if (!html) return "";
    
    // Remove eBay-specific content and seller information
    let filtered = html
      // Remove links to eBay
      .replace(/<a[^>]+href="https?:\/\/[^"]*ebay\.[^"]*"[^>]*>.*?<\/a>/gi, "")
      // Remove eBay references (case-insensitive)
      .replace(/>([^<]*)</gi, (match, text) =>
        ">" + text.replace(/ebay/gi, "").replace(/eBay/gi, "") + "<"
      )

      // Remove shipping-related content
      .replace(/<[^>]*shipping[^>]*>.*?<\/[^>]*>/gi, "")
      .replace(/shipping[^<]*<br[^>]*>/gi, "")
      // Remove seller-specific information
      .replace(/<[^>]*seller[^>]*>.*?<\/[^>]*>/gi, "")
      .replace(/seller[^<]*<br[^>]*>/gi, "")
      // Remove payment information
      .replace(/<[^>]*payment[^>]*>.*?<\/[^>]*>/gi, "")
      .replace(/payment[^<]*<br[^>]*>/gi, "")
      // Remove return policy content
      .replace(/<[^>]*return[^>]*>.*?<\/[^>]*>/gi, "")
      .replace(/return[^<]*<br[^>]*>/gi, "")
      // Remove contact information
      .replace(/<[^>]*contact[^>]*>.*?<\/[^>]*>/gi, "")
      .replace(/contact[^<]*<br[^>]*>/gi, "")
      // Clean up extra whitespace and empty tags
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/<div>\s*<\/div>/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    
    return filtered;
  }

  // Organize item specifics into categories
  const organizeSpecifics = (specifics: Record<string, string>) => {
    const categories = {
      general: {} as Record<string, string>,
      technical: {} as Record<string, string>,
      physical: {} as Record<string, string>,
      additional: {} as Record<string, string>
    };

    Object.entries(specifics).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (['brand', 'model', 'color', 'condition', 'manufacturer color'].includes(lowerKey)) {
        categories.general[key] = value;
      } else if (['storage capacity', 'memory card type', 'ram', 'processor', 'chipset model', 'operating system', 'connectivity', 'network', 'camera resolution'].includes(lowerKey)) {
        categories.technical[key] = value;
      } else if (['item height', 'item width', 'item weight', 'screen size'].includes(lowerKey)) {
        categories.physical[key] = value;
      } else {
        categories.additional[key] = value;
      }
    });

    return categories;
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;
  if (!item) return <div className="p-10 text-center">Product not found</div>;

  const organizedSpecs = hasSpecifics ? organizeSpecifics(item.itemSpecifics!) : null;

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLoginSuccess} />}
      <main className={`${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen`}>
        <SliderMenu
          isOpen={isMenuOpen}
          onCloseAction={() => setIsMenuOpen(false)}
          sortBy="newlyListed"
          setSortByAction={() => {}}
          filterCondition="all"
          setFilterConditionAction={() => {}}
          onFilterChangeAction={() => {}}
          priceRange={{ min: 0, max: 10000 }}
          setPriceRangeAction={() => {}}
          networkType="all"
          setNetworkTypeAction={() => {}}
        />

        <div className="product-detail-container mx-auto px-4 py-8">
          <div className="mb-4">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/';
                }
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 font-semibold bg-transparent border-none cursor-pointer p-0"
            >
              &larr; Go Back
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Image Gallery */} 
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-100 rounded-xl p-4 shadow-lg">
              {item.image?.imageUrl ? (
                <img
                  src={
                    currentImage === 0
                      ? item.image.imageUrl
                      : item.additionalImages && item.additionalImages[currentImage - 1]
                      ? item.additionalImages[currentImage - 1].imageUrl
                      : item.image.imageUrl
                  }
                  alt={item.title}
                  className="product-image-main"
                />
              ) : (
                <div className="product-image-main bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>
            
            {/* Image Navigation */}
            {item.additionalImages && item.additionalImages.length > 0 && (
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? (item.additionalImages?.length || 0) : prev - 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentImage + 1} / {(item.additionalImages?.length || 0) + 1}
                </span>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === (item.additionalImages?.length || 0) ? 0 : prev + 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h1>
              
              <div className="mb-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedConfig.storage ? 
                    convertToKESWithProfitStorageAndShipping(
                      item.price?.value,
                      item.condition,
                      item.title,
                      selectedConfig.storage
                    ) :
                    convertToKESWithProfitAndShipping(
                      item.price?.value,
                      item.condition,
                      item.title
                    )
                  }
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Includes shipping to US
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => {
                  document.getElementById('description')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 max-w-[200px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
              >
                View Description
              </button>
            </div>

            {/* Product Configuration */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Options</h3>
              
              {/* Storage Options */}
              {storageCapacity && storageCapacity.trim() !== '' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Storage Capacity:</label>
                  <select 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white p-3"
                    value={selectedConfig.storage || storageCapacity || ''}
                    onChange={(e) => handleConfigChange('storage', e.target.value)}
                  >
                    <option value="">Select Storage</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
              )}

              {/* Color Options */}
              {item.itemSpecifics?.Color && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Color:</label>
                  <select 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white p-3"
                    value={selectedConfig.color || item.itemSpecifics.Color || ''}
                    onChange={(e) => handleConfigChange('color', e.target.value)}
                  >
                    <option value="">Select Color</option>
                    <option value="Black">Black</option>
                    <option value="White">White</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Blue">Blue</option>
                    <option value="Red">Red</option>
                  </select>
                </div>
              )}

              {/* Network Status */}
              {network && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Network Status:</label>
                  <select 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white p-3"
                    value={selectedConfig.network || lockStatus || network || ''}
                    onChange={(e) => handleConfigChange('network', e.target.value)}
                  >
                    <option value="">Select Network Status</option>
                    <option value="Unlocked">Unlocked</option>
                    <option value="Locked">Carrier Locked</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBuyNow}
                className="flex-1 max-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition"
                disabled={buying}
              >
                {buying ? "Processing..." : "Buy Now"}
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 max-w-[200px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg shadow transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  if (!item) return;
                  const product = {
                    id: item.itemId,
                    title: item.title,
                    price: item.price?.value || '0',
                    image: item.image?.imageUrl || '/placeholder-image.jpg',
                    condition: item.condition
                  };
                  
                  if (isInWishlist(item.itemId)) {
                    removeFromWishlist(item.itemId);
                  } else {
                    addToWishlist(product);
                  }
                }}
                className={`p-3 rounded-lg shadow transition flex items-center justify-center ${
                  item && isInWishlist(item.itemId)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
                title={item && isInWishlist(item.itemId) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart 
                  className={`w-6 h-6 ${
                    item && isInWishlist(item.itemId) ? 'fill-current' : ''
                  }`} 
                />
              </button>
            </div>


            {/* Basic Product Info */}
            {!shouldHideDetails && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Product Details</h3>
                {!shouldHideCondition && item.condition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Condition:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.condition}</span>
                  </div>
                )}
                {model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Model:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{model}</span>
                  </div>
                )}
              </div>
            )}

            {/* Removed seller information section */}
          </div>
        </div>

        {/* Item Specifics Section - eBay Style */}
        {organizedSpecs && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Item Specifics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* General Information */}
              {Object.keys(organizedSpecs.general).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    General Information
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(organizedSpecs.general).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              {Object.keys(organizedSpecs.technical).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Technical Specifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(organizedSpecs.technical).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Dimensions */}
              {Object.keys(organizedSpecs.physical).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Physical Dimensions
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(organizedSpecs.physical).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Features */}
              {Object.keys(organizedSpecs.additional).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Additional Features
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(organizedSpecs.additional).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Recommendations */}
        <div className="space-y-8">
          {/* More Like This */}

          {moreLikeThisProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">More Like This</h2>
                <Link 
                  href={`/search?category=similar&itemId=${item?.itemId}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {moreLikeThisProducts.slice(0, 4).map((product) => (
                  <Link 
                    key={product.itemId} 
                    href={`/product/${product.itemId}`}
                    className="block group"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
                      {product.image?.imageUrl ? (
                        <img
                          src={product.image.imageUrl}
                          alt={product.title}
                          className="product-image-card"
                        />
                      ) : (
                        <div className="product-image-card bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {product.title}
                        </h3>
                        <div className="mt-2">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {convertToKESWithProfitAndShipping(product.price?.value, product.condition, product.title)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Includes shipping to US
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description from Seller */}
        {item.description && (
          <div id="description" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mt-8 scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Description from Seller</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
              <div
                className="prose max-w-none prose-sm dark:prose-invert text-gray-700 dark:text-gray-300"
                style={{
                  fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif",
                }}
                dangerouslySetInnerHTML={{ __html: filterDescription(item.description) }}
              />
            </div>
          </div>
        )}

        {/* Support Contact Information - Bottom of Page */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-xl text-blue-900 dark:text-blue-300 mb-4">Need Help?</h3>
          <div className="space-y-4">
            <p className="text-blue-800 dark:text-blue-200">
              Contact our support team for any questions or assistance:
            </p>
            <div className="flex flex-col space-y-4">
              <a 
                href="mailto:captynglobal@gmail.com" 
                className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-lg transition-colors"
              >
                <Mail className="w-6 h-6" />
                <span>Email: captynglobal@gmail.com</span>
              </a>
              <a 
                href="https://wa.me/254112047147" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-lg transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                <span>WhatsApp: 0112047147</span>
              </a>
            </div>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
