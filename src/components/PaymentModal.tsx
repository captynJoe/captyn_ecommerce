"use client";

import { useState } from "react";
import Image from "next/image";
import { X, CreditCard, Phone } from "lucide-react";

interface PaymentModalProps {
  amount: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

type PaymentMethod = "mpesa" | "paypal" | "card";

export default function PaymentModal({ amount, onClose, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Validation functions
  const validateMpesaNumber = (number: string) => {
    const mpesaRegex = /^254[17][0-9]{8}$/;
    return mpesaRegex.test(number);
  };

  const validateCardNumber = (number: string) => {
    const cardRegex = /^[0-9]{16}$/;
    return cardRegex.test(number.replace(/\s/g, ""));
  };

  const validateExpiryDate = (date: string) => {
    const dateRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!dateRegex.test(date)) return false;

    const [month, year] = date.split("/");
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expiry > today;
  };

  const validateCVV = (cvv: string) => {
    const cvvRegex = /^[0-9]{3,4}$/;
    return cvvRegex.test(cvv);
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
    } else if (selectedMethod === "card") {
      if (!validateCardNumber(cardNumber)) {
        setError("Please enter a valid card number");
        return;
      }
      if (!validateExpiryDate(expiryDate)) {
        setError("Please enter a valid expiry date (MM/YY)");
        return;
      }
      if (!validateCVV(cvv)) {
        setError("Please enter a valid CVV");
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
        // Initiate PayPal payment
        const response = await fetch('/api/payments/paypal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: (amount / 130).toFixed(2), // Convert KSH to USD (approximate rate)
            currency: 'USD',
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
          }),
        });

        const data = await response.json();

        if (data.success && data.approvalUrl) {
          // Redirect to PayPal for payment approval
          window.location.href = data.approvalUrl;
        } else {
          setError(data.error || 'PayPal payment failed');
        }
      } else if (selectedMethod === "card") {
        // For card payments, you would integrate with a payment processor like Stripe
        // This is a placeholder - implement actual card processing
        setError("Card payments are not yet implemented. Please use M-PESA or PayPal.");
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2);
    }
    return v;
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
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                   alt="PayPal" className="w-8 h-8 object-contain" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">PayPal</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pay with your PayPal account</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("card")}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <CreditCard className="w-8 h-8 text-gray-600" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">Credit Card</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pay with Visa, Mastercard, etc.</div>
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

            {selectedMethod === "card" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 4) setCvv(value);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedMethod === "paypal" && (
              <div className="text-center py-4">
                <img
                  src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-large.png"
                  alt="PayPal Checkout"
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You will be redirected to PayPal to complete your payment
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

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
