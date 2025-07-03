// Pricing utility functions for adding profit margins

export interface PriceInfo {
  originalPrice: number;
  finalPrice: number;
  profit: number;
  profitPercentage: number;
  bankFees: number;
  exchangeMarkup: number;
}

/**
 * Calculate the final price with profit margin based on product value and condition
 * @param originalPriceUSD - Original price in USD
 * @param condition - Product condition
 * @param title - Product title for context
 * @returns PriceInfo object with pricing details
 */
export function calculateProfitPrice(
  originalPriceUSD: number, 
  condition: string = '', 
  title: string = ''
): PriceInfo {
  // Enhanced USD to KES conversion with bank markup
  const BASE_USD_TO_KES = 130;
  const BANK_EXCHANGE_MARKUP = 0.02; // 2% bank exchange markup
  const CREDIT_CARD_FEE = 0.04; // 4% international transaction fee
  
  // Calculate effective exchange rate with bank markup
  const effectiveExchangeRate = BASE_USD_TO_KES * (1 + BANK_EXCHANGE_MARKUP);
  const originalPriceKES = originalPriceUSD * effectiveExchangeRate;
  
  // Calculate bank fees (credit card international transaction fee)
  const bankFees = originalPriceKES * CREDIT_CARD_FEE;
  const exchangeMarkup = originalPriceUSD * BASE_USD_TO_KES * BANK_EXCHANGE_MARKUP;
  
  // Base cost including all fees
  const baseCostKES = originalPriceKES + bankFees;
  
  // Smart profit percentage based on price ranges and market positioning
  let baseProfitPercentage = 0;
  
  // Enhanced profit calculation with smart pricing strategy
  if (baseCostKES < 5000) {
    // Low value items: Higher margins to cover fixed costs
    baseProfitPercentage = 0.22; // Increased from 0.18
  } else if (baseCostKES < 15000) {
    // Mid-low value items: Balanced margins
    baseProfitPercentage = 0.18; // Increased from 0.14
  } else if (baseCostKES < 30000) {
    // Mid value items: Competitive margins
    baseProfitPercentage = 0.15; // Increased from 0.11
  } else if (baseCostKES < 50000) {
    // Mid-high value items: Volume-based margins
    baseProfitPercentage = 0.12; // Increased from 0.09
  } else if (baseCostKES < 100000) {
    // High value items: Premium positioning
    baseProfitPercentage = 0.10; // Increased from 0.07
  } else {
    // Very high value items: Luxury positioning
    baseProfitPercentage = 0.08; // Increased from 0.055
  }
  
  // Smart condition-based pricing adjustments
  let conditionMultiplier = 1.0;
  const lowerCondition = condition.toLowerCase();
  
  // Enhanced condition-based profit optimization
  if (lowerCondition.includes('new') || lowerCondition.includes('brand new')) {
    conditionMultiplier = 1.0; // Standard profit for new items
  } else if (lowerCondition.includes('refurbished') || lowerCondition.includes('renewed')) {
    conditionMultiplier = 1.08; // 8% more profit for refurbished (good value proposition)
  } else if (lowerCondition.includes('very good') || lowerCondition.includes('excellent')) {
    conditionMultiplier = 1.06; // 6% more profit for excellent condition
  } else if (lowerCondition.includes('good')) {
    conditionMultiplier = 1.07; // 7% more profit for good condition
  } else if (lowerCondition.includes('used') || lowerCondition.includes('pre-owned')) {
    conditionMultiplier = 1.10; // 10% more profit for used items (higher risk compensation)
  } else if (lowerCondition.includes('for parts') || lowerCondition.includes('damaged')) {
    conditionMultiplier = 1.15; // 15% more profit for parts/damaged (significant risk)
  }
  
  // Smart market opportunity detection and pricing
  let marketOpportunityMultiplier = 1.0;
  const lowerTitle = title.toLowerCase();
  
  // Enhanced market opportunity detection for premium products
  if (lowerTitle.includes('iphone 15 pro max') && baseCostKES < 140000) {
    marketOpportunityMultiplier = 1.12; // 12% more profit for undervalued flagship
  } else if (lowerTitle.includes('iphone 15 pro') && baseCostKES < 120000) {
    marketOpportunityMultiplier = 1.10; // 10% more profit
  } else if (lowerTitle.includes('iphone 15') && baseCostKES < 100000) {
    marketOpportunityMultiplier = 1.08; // 8% more profit
  } else if (lowerTitle.includes('iphone 14 pro max') && baseCostKES < 110000) {
    marketOpportunityMultiplier = 1.09; // 9% more profit
  } else if (lowerTitle.includes('samsung galaxy s24 ultra') && baseCostKES < 120000) {
    marketOpportunityMultiplier = 1.10; // 10% more profit
  } else if (lowerTitle.includes('samsung galaxy s23 ultra') && baseCostKES < 90000) {
    marketOpportunityMultiplier = 1.08; // 8% more profit
  } else if (lowerTitle.includes('macbook pro') && baseCostKES < 180000) {
    marketOpportunityMultiplier = 1.11; // 11% more profit for undervalued MacBooks
  } else if (lowerTitle.includes('macbook air') && baseCostKES < 120000) {
    marketOpportunityMultiplier = 1.09; // 9% more profit
  } else if (lowerTitle.includes('airpods pro') && baseCostKES < 25000) {
    marketOpportunityMultiplier = 1.15; // 15% more profit for accessories
  } else if (lowerTitle.includes('apple watch') && baseCostKES < 40000) {
    marketOpportunityMultiplier = 1.12; // 12% more profit for watches
  }
  
  // Additional smart pricing for trending items
  if (lowerTitle.includes('gaming') || lowerTitle.includes('rtx') || lowerTitle.includes('ps5')) {
    marketOpportunityMultiplier *= 1.05; // 5% additional for gaming items
  }
  
  // Seasonal and demand-based adjustments
  if (lowerTitle.includes('unlocked') || lowerTitle.includes('international')) {
    marketOpportunityMultiplier *= 1.03; // 3% more for unlocked devices (higher demand in Kenya)
  }
  
  // Calculate final profit percentage with all multipliers
  const finalProfitPercentage = baseProfitPercentage * conditionMultiplier * marketOpportunityMultiplier;
  
  // Calculate profit amount and final price
  const profit = baseCostKES * finalProfitPercentage;
  const finalPrice = baseCostKES + profit;
  
  return {
    originalPrice: originalPriceKES,
    finalPrice: Math.round(finalPrice),
    profit: Math.round(profit),
    profitPercentage: Math.round(finalProfitPercentage * 100),
    bankFees: Math.round(bankFees),
    exchangeMarkup: Math.round(exchangeMarkup)
  };
}

/**
 * Format price for display
 * @param price - Price in KES
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `Ksh ${price.toLocaleString()}`;
}

/**
 * Convert USD price to KES with profit margin
 * @param usdPrice - Price in USD
 * @param condition - Product condition
 * @param title - Product title
 * @returns Formatted final price string
 */
export function convertToKESWithProfit(
  usdPrice: string | undefined, 
  condition: string = '', 
  title: string = ''
): string {
  if (!usdPrice) return "Price not available";
  
  const priceNum = parseFloat(usdPrice);
  if (isNaN(priceNum)) return "Price not available";
  
  const priceInfo = calculateProfitPrice(priceNum, condition, title);
  return formatPrice(priceInfo.finalPrice);
}

/**
 * Calculate shipping cost based on item type and weight
 * @param itemType - Type of item (phone, laptop, other)
 * @param weightKg - Weight in kilograms
 * @param quantity - Number of items
 * @returns Shipping cost in USD
 */
export function calculateShippingCost(
  itemType: 'phone' | 'laptop' | 'other' = 'other',
  weightKg: number = 1,
  quantity: number = 1
): number {
  const BASE_SHIPPING_RATE = 14.50; // USD for first kg
  const LAPTOP_BASE_RATE = 25.00; // USD base rate for laptops
  const LAPTOP_PER_KG_RATE = 12.00; // USD per additional kg for laptops
  const PHONE_BASE_RATE = 2350.14 / 131; // Convert KES to USD

  const totalWeight = weightKg * quantity;

  if (itemType === 'laptop') {
    // Higher shipping cost for laptops due to size and weight
    let cost = LAPTOP_BASE_RATE;
    if (totalWeight > 1) {
      cost += (totalWeight - 1) * LAPTOP_PER_KG_RATE;
    }
    return cost;
  } else if (itemType === 'phone') {
    // Fixed rate for phones
    return PHONE_BASE_RATE * quantity;
  } else {
    // Progressive rate for other items
    if (totalWeight <= 1) {
      return BASE_SHIPPING_RATE;
    } else if (totalWeight <= 5) {
      return BASE_SHIPPING_RATE + ((totalWeight - 1) * 8);
    } else if (totalWeight <= 10) {
      return BASE_SHIPPING_RATE + (4 * 8) + ((totalWeight - 5) * 10);
    } else {
      return BASE_SHIPPING_RATE + (4 * 8) + (5 * 10) + ((totalWeight - 10) * 12);
    }
  }
}

/**
 * Estimate item weight based on title and type
 * @param title - Product title
 * @param itemType - Type of item
 * @returns Estimated weight in kg
 */
export function estimateItemWeight(title: string, itemType?: 'phone' | 'laptop' | 'other'): number {
  const lowerTitle = title.toLowerCase();
  
  // If type is explicitly provided, use default weights
  if (itemType === 'phone') return 0.5; // 500g
  if (itemType === 'laptop') return 2.5; // 2.5kg
  if (itemType === 'other') return 1.0; // 1kg
  
  // Try to determine from title
  if (lowerTitle.includes('macbook') || lowerTitle.includes('laptop')) {
    // Laptops are heavier
    if (lowerTitle.includes('macbook pro') || lowerTitle.includes('gaming')) {
      return 3.0; // Gaming laptops and MacBook Pros are heavier
    }
    return 2.5; // Standard laptop weight
  } else if (lowerTitle.includes('iphone') || lowerTitle.includes('samsung') || 
             lowerTitle.includes('phone') || lowerTitle.includes('galaxy')) {
    return 0.5; // Phone weight
  } else if (lowerTitle.includes('tablet') || lowerTitle.includes('ipad')) {
    return 0.8; // Tablet weight
  } else if (lowerTitle.includes('watch') || lowerTitle.includes('airpods') || 
             lowerTitle.includes('earbuds')) {
    return 0.2; // Small accessories
  }
  
  return 1.0; // Default weight for unknown items
}

/**
 * Get total shipping cost including last mile delivery
 * @param shippingCost - Base shipping cost in USD
 * @returns Total shipping cost including last mile
 */
export function getTotalShippingCost(shippingCost: number): number {
  const LAST_MILE_RATE = 3.44; // USD
  return shippingCost + LAST_MILE_RATE;
}

/**
 * Calculate storage capacity price adjustment
 * @param basePrice - Base price in KES
 * @param storageCapacity - Storage capacity (e.g., "64GB", "128GB")
 * @param productTitle - Product title for context
 * @returns Adjusted price in KES
 */
export function calculateStorageAdjustment(
  basePrice: number,
  storageCapacity: string,
  productTitle: string = ''
): number {
  if (!storageCapacity) return basePrice;
  
  const storage = storageCapacity.toLowerCase();
  const title = productTitle.toLowerCase();
  
  // Storage capacity multipliers based on market value
  let storageMultiplier = 1.0;
  
  if (title.includes('iphone')) {
    // iPhone storage pricing adjustments
    if (storage.includes('64gb')) {
      storageMultiplier = 0.95; // 5% discount for base storage
    } else if (storage.includes('128gb')) {
      storageMultiplier = 1.0; // Base price
    } else if (storage.includes('256gb')) {
      storageMultiplier = 1.15; // 15% premium
    } else if (storage.includes('512gb')) {
      storageMultiplier = 1.35; // 35% premium
    } else if (storage.includes('1tb')) {
      storageMultiplier = 1.55; // 55% premium
    }
  } else if (title.includes('samsung') || title.includes('galaxy')) {
    // Samsung storage pricing adjustments
    if (storage.includes('64gb')) {
      storageMultiplier = 0.92; // 8% discount for base storage
    } else if (storage.includes('128gb')) {
      storageMultiplier = 1.0; // Base price
    } else if (storage.includes('256gb')) {
      storageMultiplier = 1.12; // 12% premium
    } else if (storage.includes('512gb')) {
      storageMultiplier = 1.28; // 28% premium
    } else if (storage.includes('1tb')) {
      storageMultiplier = 1.45; // 45% premium
    }
  } else {
    // Generic storage pricing adjustments
    if (storage.includes('64gb')) {
      storageMultiplier = 0.93; // 7% discount
    } else if (storage.includes('128gb')) {
      storageMultiplier = 1.0; // Base price
    } else if (storage.includes('256gb')) {
      storageMultiplier = 1.10; // 10% premium
    } else if (storage.includes('512gb')) {
      storageMultiplier = 1.25; // 25% premium
    } else if (storage.includes('1tb')) {
      storageMultiplier = 1.40; // 40% premium
    }
  }
  
  return Math.round(basePrice * storageMultiplier);
}

/**
 * Convert USD price to KES with profit margin and storage adjustment
 * @param usdPrice - Price in USD
 * @param condition - Product condition
 * @param title - Product title
 * @param storageCapacity - Selected storage capacity
 * @returns Formatted final price string
 */
export function convertToKESWithProfitAndStorage(
  usdPrice: string | undefined,
  condition: string = '',
  title: string = '',
  storageCapacity: string = ''
): string {
  if (!usdPrice) return "Price not available";
  
  const priceNum = parseFloat(usdPrice);
  if (isNaN(priceNum)) return "Price not available";
  
  const priceInfo = calculateProfitPrice(priceNum, condition, title);
  const adjustedPrice = calculateStorageAdjustment(priceInfo.finalPrice, storageCapacity, title);
  
  return formatPrice(adjustedPrice);
}
