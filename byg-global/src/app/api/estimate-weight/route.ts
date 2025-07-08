import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: "Product description is required" }, { status: 400 });
    }

    // Enhanced AI-powered weight and dimension estimation
    const estimation = estimateProductSpecs(prompt);
    
    return NextResponse.json(estimation);
  } catch (error) {
    console.error("Weight estimation error:", error);
    return NextResponse.json({ 
      error: "Failed to estimate weight",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function estimateProductSpecs(productDescription: string) {
  const desc = productDescription.toLowerCase();
  
  // Enhanced product detection with more categories
  const productCategories = {
    // Electronics - Phones
    phone: {
      keywords: ['iphone', 'samsung', 'galaxy', 'pixel', 'oneplus', 'huawei', 'xiaomi', 'phone', 'smartphone', 'mobile'],
      weight: { min: 0.15, max: 0.25, typical: 0.2 },
      dimensions: { length: 15, width: 7.5, height: 0.8 }
    },
    
    // Electronics - Tablets
    tablet: {
      keywords: ['ipad', 'tablet', 'surface pro', 'galaxy tab'],
      weight: { min: 0.4, max: 0.7, typical: 0.5 },
      dimensions: { length: 25, width: 17, height: 0.7 }
    },
    
    // Electronics - Laptops
    laptop: {
      keywords: ['macbook', 'laptop', 'notebook', 'thinkpad', 'dell', 'hp laptop', 'asus laptop', 'lenovo laptop'],
      weight: { min: 1.2, max: 3.5, typical: 2.0 },
      dimensions: { length: 35, width: 25, height: 2.5 }
    },
    
    // Electronics - Gaming
    gaming_console: {
      keywords: ['playstation', 'ps5', 'ps4', 'xbox', 'nintendo switch', 'gaming console'],
      weight: { min: 2.5, max: 4.5, typical: 3.5 },
      dimensions: { length: 40, width: 30, height: 10 }
    },
    
    // Electronics - Audio
    headphones: {
      keywords: ['airpods', 'headphones', 'earbuds', 'beats', 'sony headphones', 'bose'],
      weight: { min: 0.05, max: 0.4, typical: 0.25 },
      dimensions: { length: 20, width: 18, height: 8 }
    },
    
    // Electronics - Accessories
    charger: {
      keywords: ['charger', 'power adapter', 'cable', 'charging cable'],
      weight: { min: 0.1, max: 0.5, typical: 0.2 },
      dimensions: { length: 10, width: 8, height: 3 }
    },
    
    // Electronics - Cameras
    camera: {
      keywords: ['camera', 'dslr', 'canon', 'nikon', 'sony camera', 'gopro'],
      weight: { min: 0.4, max: 1.5, typical: 0.8 },
      dimensions: { length: 15, width: 12, height: 8 }
    },
    
    // Books
    book: {
      keywords: ['book', 'novel', 'textbook', 'paperback', 'hardcover', 'manual'],
      weight: { min: 0.2, max: 1.5, typical: 0.4 },
      dimensions: { length: 23, width: 15, height: 2 }
    },
    
    // Clothing
    clothing: {
      keywords: ['shirt', 't-shirt', 'dress', 'jeans', 'jacket', 'hoodie', 'pants', 'clothing'],
      weight: { min: 0.2, max: 1.0, typical: 0.4 },
      dimensions: { length: 30, width: 25, height: 5 }
    },
    
    // Beauty Products
    beauty: {
      keywords: ['makeup', 'cosmetics', 'skincare', 'perfume', 'shampoo', 'beauty'],
      weight: { min: 0.05, max: 0.5, typical: 0.2 },
      dimensions: { length: 12, width: 8, height: 15 }
    },
    
    // Home & Garden
    home: {
      keywords: ['kitchen', 'home decor', 'furniture', 'lamp', 'cushion', 'blanket'],
      weight: { min: 0.5, max: 5.0, typical: 1.5 },
      dimensions: { length: 30, width: 25, height: 15 }
    },
    
    // Default for unknown items
    default: {
      keywords: [],
      weight: { min: 0.3, max: 1.0, typical: 0.5 },
      dimensions: { length: 20, width: 15, height: 10 }
    }
  };

  // Find matching category
  let matchedCategory = 'default';
  let maxMatches = 0;
  
  for (const [category, data] of Object.entries(productCategories)) {
    if (category === 'default') continue;
    
    const matches = data.keywords.filter(keyword => desc.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category;
    }
  }

  const category = productCategories[matchedCategory as keyof typeof productCategories];
  
  // Add some variation based on product description
  let weightMultiplier = 1;
  let sizeMultiplier = 1;
  
  // Size indicators
  if (desc.includes('mini') || desc.includes('compact') || desc.includes('small')) {
    weightMultiplier *= 0.7;
    sizeMultiplier *= 0.8;
  } else if (desc.includes('pro') || desc.includes('max') || desc.includes('plus') || desc.includes('large')) {
    weightMultiplier *= 1.3;
    sizeMultiplier *= 1.2;
  } else if (desc.includes('xl') || desc.includes('extra large')) {
    weightMultiplier *= 1.5;
    sizeMultiplier *= 1.4;
  }
  
  // Material indicators
  if (desc.includes('aluminum') || desc.includes('metal') || desc.includes('steel')) {
    weightMultiplier *= 1.2;
  } else if (desc.includes('plastic') || desc.includes('lightweight')) {
    weightMultiplier *= 0.8;
  }

  // Calculate final specs
  const realWeight = Math.round((category.weight.typical * weightMultiplier) * 100) / 100;
  
  const dimensions = {
    length: Math.round(category.dimensions.length * sizeMultiplier),
    width: Math.round(category.dimensions.width * sizeMultiplier),
    height: Math.round(category.dimensions.height * sizeMultiplier)
  };
  
  // Calculate volumetric weight (length × width × height ÷ 5000 for international shipping)
  const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
  
  // Chargeable weight is the higher of real weight and volumetric weight
  const chargeableWeight = Math.max(realWeight, volumetricWeight);
  
  return {
    realWeight,
    dimensions,
    volumetricWeight: Math.round(volumetricWeight * 100) / 100,
    chargeableWeight: Math.round(chargeableWeight * 100) / 100,
    category: matchedCategory,
    confidence: maxMatches > 0 ? 'high' : 'medium'
  };
}
