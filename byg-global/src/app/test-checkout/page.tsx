'use client';

import { useState } from "react";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import AquantuoEstimator from "@/components/AquantuoEstimator";
import DeliveryDetails, { kenyanCounties } from "@/components/DeliveryDetails";
import { useRouter } from "next/navigation";

interface DeliveryDetailsType {
  county: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  intlShippingAmount?: number;
}

export default function TestCheckoutPage() {
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsType | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(300); // Base delivery fee for Nairobi

  // Mock cart items for testing
  const mockCartItems = [
    {
      itemId: "test-1",
      title: "Sample Product 1",
      price: { value: "25.99", currency: "USD" },
      image: "/captynlogo.png",
      quantity: 1,
      addedAt: new Date().toISOString(),
    },
    {
      itemId: "test-2", 
      title: "Sample Product 2",
      price: { value: "15.50", currency: "USD" },
      image: "/captynlogo.png",
      quantity: 2,
      addedAt: new Date().toISOString(),
    }
  ];

  const total = mockCartItems.reduce((sum, item) => {
    const price = item.price?.value ? parseFloat(item.price.value) : 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const handlePaymentComplete = () => {
    setShowPayment(false);
    alert("Payment successful! Thank you for your purchase.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 py-10 px-2">
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
            Test Checkout
          </h1>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            This is a test checkout page to demonstrate the payment functionality with M-PESA, PayPal, and Credit Card options.
          </p>
        </div>

        <ul className="divide-y divide-blue-100 dark:divide-gray-800">
          {mockCartItems.map((item) => (
            <li key={item.itemId} className="flex items-center gap-4 py-6">
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-contain rounded-xl border border-blue-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow"
              />
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-900 dark:text-white">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Quantity: <span className="font-semibold">{item.quantity}</span>
                </div>
                <div className="text-base text-green-700 dark:text-green-400 font-bold mt-1">
                  Ksh {(parseFloat(item.price.value) * 130 * item.quantity).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Delivery Details */}
        <DeliveryDetails 
          onDetailsChange={(details) => {
            setDeliveryDetails(details);
            // Calculate delivery fee based on county
            if (details.county) {
              const county = kenyanCounties.find(c => c.name === details.county);
              const distance = county?.distance || 0;
              setDeliveryFee(300 + (distance * 300));
            }
          }} 
        />

        {/* Order Summary */}
        <div className="mt-8 space-y-4 border-t pt-6 border-blue-100 dark:border-gray-800">
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              Ksh {(total * 130).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              Ksh {deliveryFee.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total:</span>
            <span className="text-green-700 dark:text-green-400">
              Ksh {((total * 130) + deliveryFee).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Aquantuo Price Estimator */}
        <AquantuoEstimator 
          cartTotal={total} 
          cartItems={mockCartItems.map(item => ({
            itemId: item.itemId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            type: 'other' // Since these are test items, default to 'other'
          }))}
          onInsuranceChange={(insured, cost) => setInsuranceCost(cost)}
        />


        <button
          className="mt-8 w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg text-lg transition"
          onClick={() => setShowPayment(true)}
        >
          Proceed to Payment
        </button>

        <button
          className="mt-4 w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white font-semibold py-3 rounded-xl shadow transition"
          onClick={() => router.push("/")}
        >
          Continue Shopping
        </button>
      </div>

      {showPayment && (
        <PaymentModal
          amount={(total + insuranceCost) * 130}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
