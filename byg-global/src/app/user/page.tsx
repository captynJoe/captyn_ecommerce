"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { app } from "../../utils/firebase";
import { useRouter } from "next/navigation";
import { User, ShoppingCart, Package, Settings, LogOut, Trash2, Eye } from "lucide-react";
import LoadingAnimation from "@/components/LoadingAnimation";
import LoginModal from "@/components/LoginModal";

interface CartItem {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  image: string;
  quantity: number;
  addedAt: string;
}

const USD_TO_KES = 130;

function convertToKES(value: string | undefined, currency: string | undefined) {
  if (!value) return "";
  const num = parseFloat(value);
  if (currency === "USD" || !currency) return `Ksh ${(num * USD_TO_KES).toLocaleString()}`;
  return `Ksh ${num.toLocaleString()}`;
}

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [removeMessage, setRemoveMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user's cart items
        const db = getFirestore(app);
        const cartRef = doc(db, "carts", user.uid);
        const cartDoc = await getDoc(cartRef);
        if (cartDoc.exists()) {
          setCartItems(cartDoc.data()?.items || []);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/");
  };

  const handleRemoveFromCart = async (item: CartItem) => {
    if (!user) return;
    
    try {
      const db = getFirestore(app);
      const userCartRef = doc(db, "carts", user.uid);
      
      await updateDoc(userCartRef, {
        items: arrayRemove(item)
      });
      
      setCartItems(prev => prev.filter(cartItem => cartItem.itemId !== item.itemId));
      setRemoveMessage("Item removed from cart!");
      setTimeout(() => setRemoveMessage(null), 2000);
    } catch (err) {
      setRemoveMessage("Failed to remove item.");
      setTimeout(() => setRemoveMessage(null), 2000);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (!user) {
    return (
      <LoginModal onClose={() => router.push("/")} onLogin={() => {}} />
    );
  }

  const totalItems = cartItems.length;
  const totalValue = cartItems.reduce((sum, item) => {
    if (item.price?.value) {
      const value = parseFloat(item.price.value);
      return sum + (item.price.currency === "USD" ? value * USD_TO_KES : value);
    }
    return sum;
  }, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-gray-700">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName || "Welcome Back!"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">{user.email}</p>
              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    <ShoppingCart className="w-4 h-4 inline mr-2" />
                    {totalItems} items in cart
                  </span>
                </div>
                <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    <Package className="w-4 h-4 inline mr-2" />
                    Ksh {totalValue.toLocaleString()} total value
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === "profile"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("cart")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 relative ${
                activeTab === "cart"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Account Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.displayName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Address</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Created</label>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-600" />
                      Account Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Email Verified</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.emailVerified 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {user.emailVerified ? "Verified" : "Not Verified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Provider</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                          {user.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "cart" && (
              <div>
                {removeMessage && (
                  <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                    {removeMessage}
                  </div>
                )}
                
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Start shopping to add items to your cart</p>
                    <button
                      onClick={() => router.push("/")}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Cart Items ({totalItems})
                      </h3>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          Ksh {totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {cartItems.map((item, index) => (
                        <div
                          key={`${item.itemId}-${index}`}
                          className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-24 h-24 object-contain rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500"
                              />
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {item.quantity}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-4 mb-3">
                                {item.price && (
                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {convertToKES(item.price.value, item.price.currency)}
                                  </span>
                                )}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Added {new Date(item.addedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => router.push(`/product/${item.itemId}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleRemoveFromCart(item)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ready to checkout?</h4>
                          <p className="text-gray-600 dark:text-gray-400">Total: Ksh {totalValue.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => router.push("/checkout")}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
