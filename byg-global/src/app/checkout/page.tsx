"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { app } from "../../utils/firebase";
import { ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import DeliveryDetails, { kenyanCounties } from "@/components/DeliveryDetails";
import LoadingAnimation from "@/components/LoadingAnimation";
import PaymentModal from "@/components/PaymentModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import AquantuoEstimator from "@/components/AquantuoEstimator";
import { convertToKESWithProfit, calculateProfitPrice, convertToKESWithProfitStorageAndShipping, convertToKESWithProfitAndShipping } from "@/utils/pricing";
import LoginModal from "@/components/LoginModal";
import ShippingAndOrderManager from "@/components/ShippingAndOrderManager";

interface CartItem {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  image?: string;
  quantity: number;
  addedAt: string;
  configuration?: {
    storage?: string;
    color?: string;
    network?: string;
  };
  condition?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [deliveryDetails, setDeliveryDetails] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(300); // Base local delivery fee

  const [insuranceCost, setInsuranceCost] = useState(0);
  const [isInsured, setIsInsured] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setShowLogin(true);
      } else {
        setUser(user);
        setShowLogin(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchCart = async () => {
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        const data = cartSnap.data();
        setCartItems(data.items || []);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    };
    fetchCart();
  }, [user, db]);

  const handleRemove = async (item: CartItem) => {
    if (!user) return;
    setRemoving(item.itemId + "-" + item.addedAt);
    const cartRef = doc(db, "carts", user.uid);
    await updateDoc(cartRef, {
      items: arrayRemove(item),
    });
    setCartItems((prev) =>
      prev.filter(
        (i) => i.itemId + "-" + i.addedAt !== item.itemId + "-" + item.addedAt
      )
    );
    setRemoving(null);
  };

  const handlePaymentComplete = async () => {
    if (!user) return;
    try {
      const cartRef = doc(db, "carts", user.uid);
      await updateDoc(cartRef, { items: [] });
      setCartItems([]);
      setShowPayment(false);
      alert("Payment successful! Thank you for your purchase.");
      router.push("/");
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("There was an error processing your payment. Please try again.");
    }
  };

  const total = cartItems.reduce((sum, item) => {
    if (!item.price?.value) return sum;

    // Determine if storage configuration exists for storage adjustment
    const storageCapacity = item.configuration?.storage || '';

    // Use the same pricing function as product page for consistency
    let priceString: string;
    if (storageCapacity) {
      priceString = convertToKESWithProfitStorageAndShipping(
        item.price.value,
        item.condition || '',
        item.title,
        storageCapacity
      );
    } else {
      priceString = convertToKESWithProfitAndShipping(
        item.price.value,
        item.condition || '',
        item.title
      );
    }

    // Extract numeric price from formatted string "Ksh 123,456"
    const numericPrice = parseInt(priceString.replace(/[^0-9]/g, ''), 10);
    if (isNaN(numericPrice)) return sum;

    return sum + numericPrice * (item.quantity || 1);
  }, 0);

  const paymentAmount = total + (deliveryDetails?.intlShippingAmount || 0) + insuranceCost;

  const handleInsuranceChange = (insured: boolean, cost: number) => {
    setIsInsured(insured);
    setInsuranceCost(cost);
  };

  if (loading && !showLogin) return <LoadingAnimation />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 py-10 px-2 relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/captynlogo-white.png"
          alt="CAPTYN GLOBAL Background Logo"
          className="w-96 h-96 object-contain opacity-10 block dark:hidden"
        />
        <img
          src="/captynlogo.png"
          alt="CAPTYN GLOBAL Background Logo"
          className="w-96 h-96 object-contain opacity-10 hidden dark:block"
        />
      </div>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 relative">
        <button
          className="absolute left-6 top-6 bg-blue-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-gray-700 rounded-full p-2 shadow transition"
          onClick={() => router.push("/")}
          aria-label="Back to shop"
        >
          <ArrowLeft className="w-5 h-5 text-blue-600 dark:text-white" />
        </button>
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Checkout
          </h1>
        </div>
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <div className="text-xl font-semibold text-gray-400 dark:text-gray-600 mb-2">
              Your cart is empty.
            </div>
            <button
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
              onClick={() => router.push("/")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-blue-100 dark:divide-gray-800">
              {cartItems.map((item) => (
                <li
                  key={item.itemId + "-" + item.addedAt}
                  className="flex items-center gap-4 py-6 group"
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="w-20 h-20 object-contain rounded-xl border border-blue-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                      {item.title}
                    </div>
                    {item.configuration && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                        {item.configuration.storage && (
                          <div>
                            Storage:{" "}
                            <span className="font-medium text-gray-800 dark:text-gray-300">
                              {item.configuration.storage}
                            </span>
                          </div>
                        )}
                        {item.configuration.color && (
                          <div>
                            Color:{" "}
                            <span className="font-medium text-gray-800 dark:text-gray-300">
                              {item.configuration.color}
                            </span>
                          </div>
                        )}
                        {item.configuration.network && (
                          <div>
                            Network:{" "}
                            <span className="font-medium text-gray-800 dark:text-gray-300">
                              {item.configuration.network}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Quantity: <span className="font-semibold">{item.quantity}</span>
                    </div>
                    <div className="text-base text-green-700 dark:text-green-400 font-bold mt-1">
                      {convertToKESWithProfit(item.price?.value, "", item.title)}
                    </div>
                  </div>
                  <button
                    className="ml-2 p-2 rounded-full bg-red-50 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-gray-700 transition shadow group-hover:scale-110"
                    onClick={() => handleRemove(item)}
                    disabled={removing === item.itemId + "-" + item.addedAt}
                    aria-label="Remove item"
                  >
                    {removing === item.itemId + "-" + item.addedAt ? (
                      <span className="text-xs text-red-600">...</span>
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-600" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {/* Delivery Details */}
            <DeliveryDetails
              onDetailsChange={(details) => {
                setDeliveryDetails(details);
                if (details.county) {
                  const county = kenyanCounties.find((c) => c.name === details.county);
                  const distance = county?.distance || 0;
                  setDeliveryFee(300 + distance * 300);
                }
              }}
            />

            {/* Order Summary */}
            <div className="mt-8 space-y-4 border-t pt-6 border-blue-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Ksh {total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Local delivery fee (pay on delivery):</span>
                <span>Ksh {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-amber-700 dark:text-amber-300">
                <span>Note:</span>
                <span>International shipping will be confirmed separately.</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                <span>Total payable now:</span>
                <span className="text-green-700 dark:text-green-400">
                  Ksh {paymentAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Aquantuo Estimator */}
            <AquantuoEstimator
              cartTotal={total / 160}
              cartItems={cartItems.map((item) => ({
                itemId: item.itemId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                type: item.title.toLowerCase().includes("phone")
                  ? "phone"
                  : item.title.toLowerCase().includes("laptop") ||
                    item.title.toLowerCase().includes("macbook")
                  ? "laptop"
                  : "other",
              }))}
            />

            <button
              className="mt-8 w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg text-lg transition"
              onClick={() => setShowConfirmation(true)}
              disabled={cartItems.length === 0}
            >
              Review & Pay
            </button>
            <button
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white font-semibold py-3 rounded-xl shadow transition"
              onClick={() => router.push("/")}
            >
              Continue Shopping
            </button>
          </>
        )}
      </div>

      {showConfirmation && (
        <ConfirmationModal
          items={cartItems}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => {
            setShowConfirmation(false);
            setShowPayment(true);
          }}
        />
      )}

      {showPayment && (
        <PaymentModal
          amount={paymentAmount}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => router.push("/")}
          onLogin={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
