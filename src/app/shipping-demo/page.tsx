"use client";

import { useState } from "react";
import ShippingAndOrderManager from "@/components/ShippingAndOrderManager";

export default function ShippingDemoPage() {
  const [cartTotal] = useState(57.00);
  const [ebayOrderId] = useState("12345-67890-ABCDE"); // Mock order ID for demo
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [isInsured, setIsInsured] = useState(false);

  const handleInsuranceChange = (insured: boolean, cost: number) => {
    setIsInsured(insured);
    setInsuranceCost(cost);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Shipping & Order Management Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete shipping calculator with eBay order management features
          </p>
        </div>

        {/* Sample Cart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Sample Cart
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Electronics Item (Sample)
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            {isInsured && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  Shipping Insurance
                </span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +${insuranceCost.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center font-bold">
                <span className="text-gray-900 dark:text-white">Cart Total:</span>
                <span className="text-green-600 dark:text-green-400">
                  ${(cartTotal + insuranceCost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping and Order Manager */}
        <ShippingAndOrderManager
          cartTotal={cartTotal}
          ebayOrderId={ebayOrderId}
          ebayItemId="123456789"
          onInsuranceChange={handleInsuranceChange}
        />

        {/* Features Overview */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Features Included
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Shipping Calculator
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Metric and Imperial units</li>
                <li>• Volumetric weight calculation</li>
                <li>• Real-time cost updates</li>
                <li>• Insurance options</li>
                <li>• Currency conversion (USD to KSH)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                eBay Order Management
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Money Back Guarantee info</li>
                <li>• Order cancellation requests</li>
                <li>• Direct eBay API integration</li>
                <li>• Seller communication</li>
                <li>• Order status tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
