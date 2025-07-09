"use client";

import { useState } from "react";
import { Package, Shield, AlertTriangle } from "lucide-react";

interface ShippingAndOrderManagerProps {
  cartTotal: number;
  ebayOrderId?: string;
  ebayItemId?: string;
  onInsuranceChange?: (insured: boolean, cost: number) => void;
}

export default function ShippingAndOrderManager({ 
  cartTotal, 
  ebayOrderId,
  ebayItemId,
  onInsuranceChange 
}: ShippingAndOrderManagerProps) {
  const [weight, setWeight] = useState(1);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isInsured, setIsInsured] = useState(false);
  const [showInsuranceWarning, setShowInsuranceWarning] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState<'metric' | 'imperial'>('metric');
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Shipping rates
  const SHIPPING_RATE = 18.50; // USD for first kg
  const LAST_MILE_RATE = 3.44; // USD for last mile delivery
  const KSH_RATE = 131; // KSH to USD exchange rate

  // Calculate volumetric weight
  const calculateVolumetricWeight = () => {
    const { length, width, height } = dimensions;
    // Volumetric weight formula: (L x W x H) / 5000 for cm
    // or (L x W x H) / 366 for inches
    const divisor = measurementUnit === 'metric' ? 5000 : 366;
    return (length * width * height) / divisor;
  };

  // Handle weight input
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

  // Handle dimension changes
  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    const numValue = parseFloat(value);
    setDimensions(prev => ({
      ...prev,
      [dimension]: isNaN(numValue) ? 0 : numValue
    }));
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

  // Calculate shipping costs
  const calculateShipping = () => {
    if (weight <= 0) return { 
      shipping: 0,
      lastMile: 0,
      insurance: 0,
      total: 0,
      actualWeight: 0,
      volumetricWeight: 0
    };
    
    const actualWeight = weight;
    const volumetricWeight = calculateVolumetricWeight();
    const calculatedWeight = Math.max(actualWeight, volumetricWeight);
    
    // Base shipping cost - $14.50 for first kg
    const shippingCost = calculatedWeight <= 1 ? SHIPPING_RATE : SHIPPING_RATE + ((calculatedWeight - 1) * 8);
    
    // Last mile delivery
    const lastMileCost = LAST_MILE_RATE;
    
    // Insurance cost (3% of item value if selected)
    const insuranceCost = isInsured ? cartTotal * 0.03 : 0;
    
    // Total cost
    const totalCost = shippingCost + lastMileCost + insuranceCost;
    
    return {
      shipping: shippingCost,
      lastMile: lastMileCost,
      insurance: insuranceCost,
      total: totalCost,
      actualWeight,
      volumetricWeight
    };
  };

  // Handle order cancellation request
  const handleCancelRequest = async () => {
    if (!ebayOrderId) return;
    
    try {
      const response = await fetch('/api/orders/cancel-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: ebayOrderId,
          reason: cancelReason
        }),
      });

      if (!response.ok) throw new Error('Failed to submit cancellation request');

      alert('Cancellation request submitted successfully. The seller will review your request.');
      setShowCancelRequest(false);
    } catch (error) {
      alert('Failed to submit cancellation request. Please try again.');
    }
  };

  const costs = calculateShipping();

  return (
    <div className="space-y-6">
      {/* Shipping Calculator */}
      <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Shipping Calculator
        </h2>
        
        <div className="space-y-4">
          {/* Measurement Unit Selection */}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={measurementUnit === 'metric'}
                onChange={() => setMeasurementUnit('metric')}
                className="mr-2"
              />
              Metric (cm/kg)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={measurementUnit === 'imperial'}
                onChange={() => setMeasurementUnit('imperial')}
                className="mr-2"
              />
              Imperial (inches/lbs)
            </label>
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Package Weight ({measurementUnit === 'metric' ? 'kg' : 'lbs'})
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={weight || ""}
              onChange={(e) => handleWeightChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
              } transition`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Dimensions Input */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Length ({measurementUnit === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={dimensions.length || ""}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width ({measurementUnit === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={dimensions.width || ""}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height ({measurementUnit === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={dimensions.height || ""}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
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

          {/* Insurance Warning */}
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

          {/* Cost Breakdown */}
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
            <div className="flex justify-between text-base font-bold mt-4 pt-2 border-t border-blue-100 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total Payable:</span>
              <div className="text-right">
                <div className="text-green-600 dark:text-green-400">
                  ${costs.total.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  (In Kenyan Shilling KSh {(costs.total * KSH_RATE).toFixed(2)})
                </div>
              </div>
            </div>

            {/* Weight Details */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <div>Actual Weight: {costs.actualWeight.toFixed(2)} {measurementUnit === 'metric' ? 'kg' : 'lbs'}</div>
              <div>Volumetric Weight: {costs.volumetricWeight.toFixed(2)} {measurementUnit === 'metric' ? 'kg' : 'lbs'}</div>
              <div className="text-xs mt-1">
                * Pricing is based on the greater of actual or volumetric weight
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Management */}
      {ebayOrderId && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            eBay Money Back Guarantee
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Your purchase is protected by eBay Money Back Guarantee. If you don't receive your item or it's not as described, we'll help you get your money back.
            </p>

            {/* Cancel Order Request */}
            <div>
              <button
                onClick={() => setShowCancelRequest(true)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Request Order Cancellation
              </button>

              {showCancelRequest && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Cancel Order Request
                  </h3>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded"
                  >
                    <option value="">Select a reason</option>
                    <option value="address_change">Need to change shipping address</option>
                    <option value="payment_issue">Payment issue</option>
                    <option value="price_too_high">Found better price elsewhere</option>
                    <option value="ordered_mistake">Ordered by mistake</option>
                    <option value="other">Other reason</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelRequest}
                      disabled={!cancelReason}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Submit Request
                    </button>
                    <button
                      onClick={() => setShowCancelRequest(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Note: Order cancellation is subject to seller approval and eBay policies.
              Cancellation requests are typically processed within 24 hours.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
