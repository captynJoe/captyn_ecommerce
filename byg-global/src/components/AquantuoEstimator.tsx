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

interface EstimationResult {
  realWeight: number;
  dimensions: { length: number; width: number; height: number };
  volumetricWeight: number;
  chargeableWeight: number;
  category: string;
  confidence: string;
}

export default function AquantuoEstimator({ cartTotal, cartItems = [], onInsuranceChange }: AquantuoEstimatorProps) {
  const [weight, setWeight] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isInsured, setIsInsured] = useState(true);
  const [showInsuranceWarning, setShowInsuranceWarning] = useState(false);
  
  // Enhanced estimation states
  const [showEstimationBot, setShowEstimationBot] = useState(false);
  const [productInfo, setProductInfo] = useState("");
  const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);
  const [estimationLoading, setEstimationLoading] = useState(false);
  const [useAIEstimation, setUseAIEstimation] = useState(false);

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
    gaming: 4.5, // 4.5kg for gaming consoles (corrected from 0.8kg)
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

    // If AI estimation is enabled and cart has items, use AI estimation for combined items
    if (useAIEstimation && cartItems.length > 0 && estimationResult) {
      return estimationResult.chargeableWeight;
    }

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

        {/* AI-Powered Weight Estimation Bot */}
        {cartItems.length === 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                🤖 AI Weight Estimator
              </h3>
              <button
                onClick={() => setShowEstimationBot(!showEstimationBot)}
                className="text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
              >
                {showEstimationBot ? 'Hide' : 'Use AI'}
              </button>
            </div>
            
            {showEstimationBot && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Title & Description:
                  </label>
                  <textarea
                    rows={3}
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                    placeholder="Enter product title and description for accurate weight estimation..."
                    style={{ fontSize: '16px' }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
                
                <button
                  onClick={async () => {
                    if (!productInfo.trim()) return;
                    
                    setEstimationLoading(true);
                    try {
                      const response = await fetch("/api/estimate-weight", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: productInfo }),
                      });
                      const data = await response.json();
                      setEstimationResult(data);
                      setWeight(data.chargeableWeight);
                      setUseAIEstimation(true);
                    } catch (err) {
                      console.error("Estimation failed", err);
                    } finally {
                      setEstimationLoading(false);
                    }
                  }}
                  disabled={estimationLoading || !productInfo.trim()}
                  className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {estimationLoading ? "🔄 Analyzing..." : "🎯 Get AI Estimation"}
                </button>

                {estimationResult && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                      📊 AI Analysis Results
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        estimationResult.confidence === 'high' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {estimationResult.confidence} confidence
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">📏 Dimensions (cm):</span>
                        <div className="font-medium">{estimationResult.dimensions.length} × {estimationResult.dimensions.width} × {estimationResult.dimensions.height}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">⚖️ Real Weight:</span>
                        <div className="font-medium">{estimationResult.realWeight} kg</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">📦 Volumetric Weight:</span>
                        <div className="font-medium">{estimationResult.volumetricWeight} kg</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">💰 Chargeable Weight:</span>
                        <div className="font-medium text-purple-600 dark:text-purple-400">{estimationResult.chargeableWeight} kg</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <strong>Category:</strong> {estimationResult.category.replace('_', ' ')} • 
                      <strong> Billing:</strong> Higher of real weight ({estimationResult.realWeight}kg) or volumetric weight ({estimationResult.volumetricWeight}kg)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Package Weight (kg) {cartItems.length > 0 ? '(Auto-calculated from cart)' : useAIEstimation ? '(AI Estimated)' : ''}
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={cartItems.length > 0 ? calculateTotalWeight().toFixed(2) : (weight || "")}
            onChange={(e) => {
              handleWeightChange(e.target.value);
              setUseAIEstimation(false);
            }}
            disabled={cartItems.length > 0}
            className={`w-full px-3 py-2 rounded-lg border ${
              error ? 'border-red-500 dark:border-red-500' : useAIEstimation ? 'border-purple-500 dark:border-purple-500' : 'border-gray-300 dark:border-gray-600'
            } ${cartItems.length > 0 ? 'bg-gray-100 dark:bg-gray-600' : useAIEstimation ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-red-500' : useAIEstimation ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
            } transition`}
            placeholder="Enter weight in kg"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {useAIEstimation && !error && (
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              ✨ Weight estimated using AI analysis
            </p>
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
