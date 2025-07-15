'use client';

import { useState } from "react";
import AquantuoEstimator, { CartItem } from "@/components/AquantuoEstimator";

export default function EstimatorDemoPage() {
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [isInsured, setIsInsured] = useState(false);

  // Sample cart items for testing
  const sampleCartItems: CartItem[] = [
    {
      itemId: "demo-1",
      title: "iPhone 13 Pro",
      price: { value: "999", currency: "USD" },
      quantity: 1,
      type: 'phone'
    },
    {
      itemId: "demo-2",
      title: "MacBook Air M1",
      price: { value: "999", currency: "USD" },
      quantity: 1,
      type: 'laptop'
    }
  ];

  // Calculate cart total
  const cartTotal = sampleCartItems.reduce((sum, item) => {
    const price = item.price?.value ? parseFloat(item.price.value) : 0;
    return sum + price * item.quantity;
  }, 0);

  const handleInsuranceChange = (insured: boolean, cost: number) => {
    setIsInsured(insured);
    setInsuranceCost(cost);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
          Aquantuo Shipping Estimator Demo
        </h1>
        
        <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sample Cart</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cart Total: <span className="font-bold text-green-600 dark:text-green-400">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <AquantuoEstimator 
          cartTotal={cartTotal} 
          cartItems={sampleCartItems}
          onInsuranceChange={handleInsuranceChange}
        />

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cart Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</span>
            </div>
            {isInsured && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Insurance:</span>
                <span className="font-medium text-gray-900 dark:text-white">${insuranceCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Final Total:</span>
              <span className="text-green-600 dark:text-green-400">
                ${(cartTotal + insuranceCost).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
