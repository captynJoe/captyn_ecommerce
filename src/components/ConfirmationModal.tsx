"use client";

import { useState } from "react";
import { X, AlertCircle, Smartphone, Package, Check } from "lucide-react";

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
}

interface ConfirmationModalProps {
  items: CartItem[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmationModal({ items, onClose, onConfirm }: ConfirmationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Check if any item is a phone (based on title or configuration)
  const hasPhones = items.some(
    item => 
      item.title.toLowerCase().includes("phone") ||
      item.title.toLowerCase().includes("iphone") ||
      item.configuration?.network
  );

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
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
            Confirm Your Order
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Please review your items and confirm the details below
          </p>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </h3>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.itemId + "-" + item.addedAt} className="flex gap-3">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {item.title}
                    </p>
                    {item.configuration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Object.entries(item.configuration)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" • ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Notices */}
          <div className="space-y-4">
            {hasPhones && (
              <div className="flex gap-3 items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">
                    Phone Verification
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Please confirm that you have verified:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Network compatibility and unlock status
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Storage capacity meets your needs
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Color and condition as described
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-start p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-300">
                  Important Notice
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                  <li>• Not all sales can be returned, liaise with seller</li>
                  <li>• Please confirm everything in the description</li>
                  <li>• Contact support via email for any questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I confirm that I have reviewed all items in my cart, verified their specifications,
              and agree to the terms of purchase.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
