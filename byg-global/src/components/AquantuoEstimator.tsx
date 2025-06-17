"use client";

import { useState, useEffect } from "react";

export interface CartItem {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  quantity: number;
  weight?: number; // in grams
  type?: 'phone' | 'laptop' | 'other';
}

interface AquantuoEstimatorProps {
  cartTotal: number;
  cartItems: CartItem[];
  onInsuranceChange?: (insured: boolean, cost: number) => void;
}

export default function AquantuoEstimator({ cartTotal, cartItems = [], onInsuranceChange }: AquantuoEstimatorProps) {
  const [weight, setWeight] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isInsured, setIsInsured] = useState(true);
  const [showInsuranceWarning, setShowInsuranceWarning] = useState(false);

  // Base shipping rates
  const BASE_SHIPPING_RATE = 14.50; // USD for first kg
  const LAST_MILE_RATE = 3.44; // USD for last mile delivery
  const PHONE_BASE_RATE = 2350.14; // Base rate for phones in KES
  const LAPTOP_BASE_RATE = 25.00; // USD base rate for laptops (first kg)
  const LAPTOP_PER_KG_RATE = 12.00; // USD per additional kg for laptops
  const CONSOLIDATION_DISCOUNT = 0.6; // 40% discount on additional items
  
  // Default weights if not provided
  const DEFAULT_WEIGHTS = {
    phone: 0.5, // 500g for phones
    laptop: 2.5, // 2.5kg for laptops
    other: 1.0 // 1kg for other items
  };

  // Validate weight input
  const handleWeightChange = (value: string) => {
    const numValue = parseFloat(value);
    setError(null);

    if (value === "") {
      setWeight(0);
      setError("Weight is required");
      return;
    }

    if (isNaN(numValue)) {
      setWeight(0);
      setError("Please enter a valid number");
      return;
    }

    if (numValue <= 0) {
      setWeight(0);
      setError("Weight must be greater than 0");
      return;
    }

    if (numValue > 100) {
      setWeight(100);
      setError("Maximum weight is 100kg. Contact support for larger shipments.");
      return;
    }

    setWeight(numValue);
  };

  // Handle insurance selection
  const handleInsuranceChange = (insured: boolean) => {
    if (!insured) {
      setShowInsuranceWarning(true);
      return;
    }
    setIsInsured(insured);
    setShowInsuranceWarning(false);
    const insuranceCost = cartTotal * 0.03;
    onInsuranceChange?.(insured, insuranceCost);
  };

  const confirmNoInsurance = () => {
    setIsInsured(false);
    setShowInsuranceWarning(false);
    onInsuranceChange?.(false, 0);
  };

  // Calculate total weight of cart items
  const calculateTotalWeight = () => {
    if (cartItems.length === 0) return weight;

    return cartItems.reduce((total, item) => {
      // Convert weight from grams to kg if provided, otherwise use default weight
      const itemWeight = item.weight ? item.weight / 1000 : DEFAULT_WEIGHTS[item.type || 'other'];
      return total + (itemWeight * item.quantity);
    }, 0);
  };

  // Calculate consolidated shipping cost
  const calculateShipping = () => {
    if (cartItems.length === 0) {
      return calculateBasicShipping(weight);
    }

    let totalShippingCost = 0;
    let laptopCount = 0;
    let phoneCount = 0;
    let totalWeight = 0;

    // First pass: count items and calculate total weight
    cartItems.forEach(item => {
      if (item.type === 'laptop') {
        laptopCount += item.quantity;
        totalWeight += (item.weight ? item.weight / 1000 : DEFAULT_WEIGHTS.laptop) * item.quantity;
      } else if (item.type === 'phone') {
        phoneCount += item.quantity;
        totalWeight += (item.weight ? item.weight / 1000 : DEFAULT_WEIGHTS.phone) * item.quantity;
      } else {
        totalWeight += (item.weight ? item.weight / 1000 : DEFAULT_WEIGHTS.other) * item.quantity;
      }
    });

    // Calculate laptop shipping cost if present
    if (laptopCount > 0) {
      // Base rate for first laptop
      totalShippingCost = LAPTOP_BASE_RATE;
      
      // Additional weight cost for laptops
      if (totalWeight > 1) {
        totalShippingCost += (totalWeight - 1) * LAPTOP_PER_KG_RATE;
      }

      // Add discounted phone shipping if any
      if (phoneCount > 0) {
        const phoneShipping = (PHONE_BASE_RATE / 131) * CONSOLIDATION_DISCOUNT * phoneCount;
        totalShippingCost += phoneShipping;
      }
    } else if (phoneCount > 0) {
      // Base rate for first phone
      totalShippingCost = PHONE_BASE_RATE / 131;
      
      // Discounted rate for additional phones
      if (phoneCount > 1) {
        totalShippingCost += ((PHONE_BASE_RATE / 131) * CONSOLIDATION_DISCOUNT * (phoneCount - 1));
      }
    } else {
      // Default to weight-based shipping for other items
      totalShippingCost = calculateBasicShipping(totalWeight).shipping;
    }

    const insuranceCost = isInsured ? cartTotal * 0.03 : 0;
    const totalCost = totalShippingCost + LAST_MILE_RATE + insuranceCost;

    return {
      shipping: totalShippingCost,
      lastMile: LAST_MILE_RATE,
      insurance: insuranceCost,
      total: totalCost
    };
  };

  // Basic weight-based shipping calculation
  const calculateBasicShipping = (weightKg: number) => {
    if (weightKg <= 0) return {
      shipping: 0,
      lastMile: 0,
      insurance: 0,
      total: 0
    };

    // Progressive rate increase for heavier items
    let shippingCost;
    if (weightKg <= 1) {
      shippingCost = BASE_SHIPPING_RATE;
    } else if (weightKg <= 5) {
      shippingCost = BASE_SHIPPING_RATE + ((weightKg - 1) * 8);
    } else if (weightKg <= 10) {
      shippingCost = BASE_SHIPPING_RATE + (4 * 8) + ((weightKg - 5) * 10);
    } else {
      shippingCost = BASE_SHIPPING_RATE + (4 * 8) + (5 * 10) + ((weightKg - 10) * 12);
    }
    const insuranceCost = isInsured ? cartTotal * 0.03 : 0;
    const totalCost = shippingCost + LAST_MILE_RATE + insuranceCost;

    return {
      shipping: shippingCost,
      lastMile: LAST_MILE_RATE,
      insurance: insuranceCost,
      total: totalCost
    };
  };

  const costs = calculateShipping();

  // Notify parent component of insurance changes
  useEffect(() => {
    onInsuranceChange?.(isInsured, costs.insurance);
  }, [isInsured, costs.insurance, onInsuranceChange]);

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">📦</span>
        Shipping Cost Estimator
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Package Weight (kg)
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weight || ""}
            onChange={(e) => handleWeightChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
            } transition`}
            placeholder="Enter weight in kg"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Insurance Option */}
        <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="insurance"
              checked={isInsured}
              onChange={(e) => handleInsuranceChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="insurance" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Shipping Insurance (3% of item value)
            </label>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            ${(cartTotal * 0.03).toFixed(2)}
          </span>
        </div>

        {/* Insurance Warning Modal */}
        {showInsuranceWarning && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Are you sure you want to proceed without insurance? Your shipment won't be protected against loss or damage.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmNoInsurance}
                className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700 transition"
              >
                Continue without Insurance
              </button>
              <button
                onClick={() => handleInsuranceChange(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add Insurance
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2 border-t border-blue-100 dark:border-gray-700 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Shipping Cost:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${costs.shipping.toFixed(2)}
            </span>
          </div>
          {isInsured && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Insurance:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${costs.insurance.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Mile Delivery:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${costs.lastMile.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Promo Code:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              − $0.00
            </span>
          </div>
          <div className="flex justify-between text-base font-bold mt-4 pt-2 border-t border-blue-100 dark:border-gray-700">
            <span className="text-gray-900 dark:text-white">Total Payable:</span>
            <div className="text-right">
              <div className="text-green-600 dark:text-green-400">
                ${costs.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                (In Kenyan Shilling KSh {(costs.total * 131).toFixed(2)})
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Note: Final shipping fees are calculated based on the higher of the actual or volumetric weight.
          For shipments over 100kg, please contact our support team for a custom quote.
        </div>
      </div>
    </div>
  );
}
