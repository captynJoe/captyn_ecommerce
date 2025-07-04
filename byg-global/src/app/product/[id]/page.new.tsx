"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, arrayUnion } from "firebase/firestore";
import { app } from "../../../utils/firebase";
import LoadingAnimation from "@/components/LoadingAnimation";
import LoginModal from "@/components/LoginModal";
import SliderMenu from "@/components/SliderMenu";
import { convertToKESWithProfit, convertToKESWithProfitAndStorage } from "@/utils/pricing";
import { useWishlist } from "@/contexts/WishlistContext";
import { useApp } from "@/contexts/AppContext";
import { Heart } from "lucide-react";
import Link from "next/link";

// ... [keep all the interfaces and helper functions] ...

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDark } = useApp();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
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
            storage: selectedConfig.storage || item.itemSpecifics?.["Storage Capacity"] || '',
            color: selectedConfig.color || item.itemSpecifics?.Color || '',
            network: selectedConfig.network || item.itemSpecifics?.Network || ''
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
              storage: selectedConfig.storage || item.itemSpecifics?.["Storage Capacity"] || '',
              color: selectedConfig.color || item.itemSpecifics?.Color || '',
              network: selectedConfig.network || item.itemSpecifics?.Network || ''
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



  // ... [keep all the existing state and effects] ...

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLoginSuccess} />}
      <main className={`${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen`}>
        {/* ... [keep existing SliderMenu component] ... */}

        <div className="w-full px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* ... [keep existing Image Gallery section] ... */}

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* ... [keep existing product title and price] ... */}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
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
                    const db = getFirestore(app);
                    const cartRef = doc(db, "carts", user.uid);
                    setDoc(
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
                            storage: selectedConfig.storage || item.itemSpecifics?.["Storage Capacity"] || '',
                            color: selectedConfig.color || item.itemSpecifics?.Color || '',
                            network: selectedConfig.network || item.itemSpecifics?.Network || ''
                          }
                        }),
                      },
                      { merge: true }
                    ).then(() => {
                      setBuying(false);
                      router.push('/checkout');
                    }).catch(() => {
                      setBuying(false);
                      alert('Failed to process purchase. Please try again.');
                    });
                  }}
                  className="flex-1 max-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition"
                  disabled={buying}
                >
                  {buying ? "Processing..." : "Buy Now"}
                </button>
                <button
                  onClick={() => {
                    const auth = getAuth(app);
                    const db = getFirestore(app);
                    const user = auth.currentUser;
                    if (!user) {
                      setShowLogin(true);
                      return;
                    }
                    if (!item) return;
                    const cartRef = doc(db, "carts", user.uid);
                    setDoc(
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
                            storage: selectedConfig.storage || item.itemSpecifics?.["Storage Capacity"] || '',
                            color: selectedConfig.color || item.itemSpecifics?.Color || '',
                            network: selectedConfig.network || item.itemSpecifics?.Network || ''
                          }
                        }),
                      },
                      { merge: true }
                    );
                    alert("Added to cart!");
                  }}
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


              {/* Support Contact Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-300 mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Contact our support team for any questions or assistance:
                  </p>
                  <div className="flex flex-col space-y-2">
                    <a 
                      href="tel:0112047147" 
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      📞 Call: 0112047147
                    </a>
                    <a 
                      href="https://wa.me/254112047147" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                    >
                      💬 WhatsApp: 0112047147
                    </a>
                  </div>
                </div>
              </div>

              {/* ... [keep rest of the product info sections] ... */}
            </div>
          </div>

          {/* ... [keep rest of the components] ... */}
        </div>
      </main>
    </>
  );
}
