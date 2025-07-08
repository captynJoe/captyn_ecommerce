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

  // Base shipping rates (Updated pricing logic)
  const BASE_RATE_KES = 2500; // KES for packages under 1kg
  const PER_KG_RATE_KES = 2500; // KES per kg for items over 1kg
  const LAST_MILE_RATE = 3.44; // USD for last mile delivery
  const USD_TO_KES = 133; // Exchange rate
  
  // Default weights if not provided (auto-detected from product titles)
  const DEFAULT_WEIGHTS = {
    phone: 0.2, // 200g for phones
    laptop: 2.0, // 2kg for laptops
    tablet: 0.5, // 500g for tablets
    gaming: 0.8, // 800g for gaming accessories
    other: 0.5 // 500g for other items
  };

  // Detect product type from title for better weight estimation
  const detectProductType = (title: string): keyof typeof DEFAULT_WEIGHTS => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('phone') || lowerTitle.includes('iphone') || lowerTitle.includes('samsung') || lowerTitle.includes('mobile')) {
      return 'phone';
    } else if (lowerTitle.includes('laptop') || lowerTitle.includes('macbook') || lowerTitle.includes('notebook')) {
      return 'laptop';
    } else if (lowerTitle.includes('tablet') || lowerTitle.includes('ipad')) {
      return 'tablet';
    } else if (lowerTitle.includes('gaming') || lowerTitle.includes('console') || lowerTitle.includes('playstation') || lowerTitle.includes('xbox')) {
      return 'gaming';
    }
    return 'other';
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

  // Calculate total weight of cart items with intelligent product detection
  const calculateTotalWeight = () => {
    if (cartItems.length === 0) return weight;

    return cartItems.reduce((total, item) => {
      // Convert weight from grams to kg if provided, otherwise detect from title
      let itemWeight: number;
      if (item.weight) {
        itemWeight = item.weight / 1000; // Convert grams to kg
      } else if (item.type && DEFAULT_WEIGHTS[item.type as keyof typeof DEFAULT_WEIGHTS]) {
        itemWeight = DEFAULT_WEIGHTS[item.type as keyof typeof DEFAULT_WEIGHTS];
      } else {
        // Auto-detect product type from title
        const detectedType = detectProductType(item.title);
        itemWeight = DEFAULT_WEIGHTS[detectedType];
      }
      return total + (itemWeight * item.quantity);
    }, 0);
  };

  // Calculate shipping cost with corrected pricing logic
  const calculateShipping = () => {
    if (cartItems.length === 0) {
      return calculateBasicShipping(weight);
    }

    const totalWeight = calculateTotalWeight();
    let shippingCostKES = 0;

    if (totalWeight <= 1) {
      // Package under 1kg: flat rate regardless of number of items
      shippingCostKES = BASE_RATE_KES; // 2500 KES
    } else {
      // Package over 1kg: multiply by total weight
      shippingCostKES = totalWeight * PER_KG_RATE_KES; // 2500 KES per kg
    }

    // Convert to USD
    const shippingCostUSD = shippingCostKES / USD_TO_KES;
    const insuranceCost = isInsured ? cartTotal * 0.03 : 0;
    const totalCost = shippingCostUSD + LAST_MILE_RATE + insuranceCost;

    return {
      shipping: shippingCostUSD,
      lastMile: LAST_MILE_RATE,
      insurance: insuranceCost,
      total: totalCost,
      weightKES: shippingCostKES,
      totalWeightKg: totalWeight
    };
  };

  // Basic weight-based shipping calculation with new pricing logic
  const calculateBasicShipping = (weightKg: number) => {
    if (weightKg <= 0) return {
      shipping: 0,
      lastMile: 0,
      insurance: 0,
      total: 0
    };

    let shippingCostKES = 0;

    if (weightKg <= 1) {
      shippingCostKES = BASE_RATE_KES; // 2500 KES for packages under 1kg
    } else {
      shippingCostKES = weightKg * PER_KG_RATE_KES; // 2500 KES per kg for items over 1kg
    }

    // Convert to USD
    const shippingCostUSD = shippingCostKES / USD_TO_KES;
    const insuranceCost = isInsured ? cartTotal * 0.03 : 0;
    const totalCost = shippingCostUSD + LAST_MILE_RATE + insuranceCost;

    return {
      shipping: shippingCostUSD,
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
        {/* Show detected cart items and their weights */}
        {cartItems.length > 0 && (
          <div className="p-3 bg-blue-50/50 dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detected Items & Estimated Weights:
            </h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {cartItems.map((item, index) => {
                const detectedType = detectProductType(item.title);
                const itemWeight = item.weight ? item.weight / 1000 : DEFAULT_WEIGHTS[detectedType];
                return (
                  <div key={index} className="flex justify-between">
                    <span>{item.title.substring(0, 30)}... (x{item.quantity})</span>
                    <span>{(itemWeight * item.quantity).toFixed(2)}kg</span>
                  </div>
                );
              })}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-1 mt-2 font-medium">
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span>{calculateTotalWeight().toFixed(2)}kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Package Weight (kg) {cartItems.length > 0 ? '(Auto-calculated from cart)' : ''}
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={cartItems.length > 0 ? calculateTotalWeight().toFixed(2) : (weight || "")}
            onChange={(e) => handleWeightChange(e.target.value)}
            disabled={cartItems.length > 0}
            className={`w-full px-3 py-2 rounded-lg border ${
              error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${cartItems.length > 0 ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
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
                (In Kenyan Shilling KSh {(costs.total * USD_TO_KES).toFixed(2)})
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            <strong>Pricing Logic:</strong> Packages under 1kg cost KSh 2,500 flat rate. 
            Items over 1kg are charged KSh 2,500 per kg (e.g., 1.2kg laptop = 1.2 × 2,500 = KSh 3,000).
          </p>
          <p>
            <strong>Weight Detection:</strong> System automatically detects product types (phones: 0.2kg, laptops: 2kg, tablets: 0.5kg, gaming: 0.8kg) from cart items.
          </p>
          <p>
            <strong>Note:</strong> Final shipping fees are calculated based on the higher of the actual or volumetric weight.
            Volumetric weight may apply for large, lightweight packages. For shipments over 100kg, please contact our support team for a custom quote.
          </p>
          <p className="text-red-600 dark:text-red-400">
            <strong>⚠️ Important:</strong> Guns, drugs, and other illegal items cannot be shipped and will be rejected.
          </p>
        </div>
      </div>
    </div>
  );
}
