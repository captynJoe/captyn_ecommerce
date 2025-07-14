"use client";

import { useState } from "react";
import Image from "next/image";
import { X, CreditCard, Phone } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface PaymentModalProps {
  amount: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

type PaymentMethod = "mpesa" | "paypal";

export default function PaymentModal({ amount, onClose, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");

  // Validation functions
  const validateMpesaNumber = (number: string) => {
    const mpesaRegex = /^254[17][0-9]{8}$/;
    return mpesaRegex.test(number);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate based on payment method
    if (selectedMethod === "mpesa") {
      if (!validateMpesaNumber(phoneNumber)) {
        setError("Please enter a valid M-PESA number (format: 254XXXXXXXXX)");
        return;
      }
    }

    setLoading(true);

    try {
      if (selectedMethod === "mpesa") {
        // Initiate M-PESA payment
        const response = await fetch('/api/payments/mpesa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            amount: Math.round(amount), // M-PESA requires whole numbers
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert(`An M-PESA prompt has been sent to ${phoneNumber}. Please check your phone to complete the payment.`);
          // You might want to poll for payment status here
          onPaymentComplete();
        } else {
          setError(data.error || 'M-PESA payment failed');
        }
      } else if (selectedMethod === "paypal") {
        // PayPal payments are now handled by the PayPalButton component
        // This section is no longer needed as the PayPal SDK handles the payment flow
        setError("Please use the PayPal button above to complete your payment.");
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Select Payment Method
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Amount to pay: Ksh {amount.toLocaleString()}
          </p>
        </div>

        {!selectedMethod ? (
          <div className="grid gap-4">
            <button
              onClick={() => setSelectedMethod("mpesa")}
              className="flex items-center gap-4 p-4 bg-green-50 dark:bg-gray-800 rounded-xl hover:bg-green-100 dark:hover:bg-gray-700 transition"
            >
              <Phone className="w-8 h-8 text-green-600" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">M-PESA</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pay via M-PESA mobile money</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("paypal")}
              className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-xl hover:bg-blue-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-2">
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                     alt="PayPal" className="w-8 h-8 object-contain" />
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">PayPal</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pay with PayPal or Credit/Debit Card</div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-4">
            {selectedMethod === "mpesa" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  M-PESA Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="254700000000"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 12) setPhoneNumber(value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="^254[17][0-9]{8}$"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Format: 254XXXXXXXXX
                </p>
              </div>
            )}


            {selectedMethod === "paypal" && (
              <div className="py-4">
                <div className="text-center mb-4">
                  <img
                    src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-large.png"
                    alt="PayPal Checkout"
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay securely with PayPal
                  </p>
                </div>
                <PayPalButton
                  amount={amount}
                  onSuccess={(details) => {
                    console.log("PayPal payment successful:", details);
                    onPaymentComplete();
                  }}
                  onError={(error) => {
                    console.error("PayPal payment error:", error);
                    setError("PayPal payment failed. Please try again.");
                  }}
                  onCancel={() => {
                    setError("PayPal payment was cancelled.");
                  }}
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {selectedMethod !== "paypal" && (
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod(null);
                    setError("");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            )}

            {selectedMethod === "paypal" && (
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod(null);
                    setError("");
                  }}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition"
                >
                  Back to Payment Methods
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            SSL Secured Payment
          </span>
        </div>
      </div>
    </div>
  );
}
