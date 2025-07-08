import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: "Product description is required" }, { status: 400 });
    }

    // Try AI-powered estimation first, fallback to rule-based
    let estimation;
    try {
      estimation = await getAIEstimation(prompt);
    } catch (aiError) {
      console.log("AI estimation failed, using rule-based fallback:", aiError);
      estimation = estimateProductSpecs(prompt);
    }
    
    return NextResponse.json(estimation);
  } catch (error) {
    console.error("Weight estimation error:", error);
    return NextResponse.json({ 
      error: "Failed to estimate weight",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function getAIEstimation(productDescription: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `You are a shipping expert. Analyze this product description and provide accurate weight and dimensions for shipping calculations.

Product: "${productDescription}"

Please respond with ONLY a JSON object in this exact format:
{
  "realWeight": <weight in kg>,
  "dimensions": {
    "length": <length in cm>,
    "width": <width in cm>, 
    "height": <height in cm>
  },
  "category": "<product category>",
  "confidence": "<high/medium/low>"
}

Use real-world specifications. For example:
- PS5: 4.5kg, 39×26×10cm
- iPhone 15: 0.17kg, 15×7×0.8cm
- MacBook Pro 16": 2.1kg, 35×25×1.6cm
- Nintendo Switch: 0.4kg, 24×10×1.4cm

Be precise and realistic.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content;
  
  if (!aiResponse) {
    throw new Error("No response from OpenAI");
  }

  try {
    const parsed = JSON.parse(aiResponse);
    
    // Calculate volumetric weight (length × width × height ÷ 5000 for international shipping)
    const volumetricWeight = (parsed.dimensions.length * parsed.dimensions.width * parsed.dimensions.height) / 5000;
    
    // Chargeable weight is the higher of real weight and volumetric weight
    const chargeableWeight = Math.max(parsed.realWeight, volumetricWeight);
    
    return {
      ...parsed,
      volumetricWeight: Math.round(volumetricWeight * 100) / 100,
      chargeableWeight: Math.round(chargeableWeight * 100) / 100,
      source: 'ai'
    };
  } catch (parseError) {
    throw new Error("Failed to parse AI response");
  }
}

function estimateProductSpecs(productDescription: string) {
  const desc = productDescription.toLowerCase();
  
  // Enhanced product detection with accurate real-world weights
  const productCategories = {
    // Gaming Consoles - Updated with accurate weights
    ps5: {
      keywords: ['ps5', 'playstation 5', 'sony ps5'],
      weight: { min: 4.2, max: 4.8, typical: 4.5 },
      dimensions: { length: 39, width: 26, height: 10.4 }
    },
    
    ps4: {
      keywords: ['ps4', 'playstation 4', 'sony ps4'],
      weight: { min: 2.5, max: 3.2, typical: 2.8 },
      dimensions: { length: 36, width: 27.5, height: 5.3 }
    },
    
    xbox_series: {
      keywords: ['xbox series x', 'xbox series s', 'xbox series'],
      weight: { min: 2.3, max: 4.5, typical: 3.8 },
      dimensions: { length: 30, width: 15, height: 15 }
    },
    
    nintendo_switch: {
      keywords: ['nintendo switch', 'switch console', 'switch oled'],
      weight: { min: 0.3, max: 0.42, typical: 0.4 },
      dimensions: { length: 24, width: 10.2, height: 1.4 }
    },
    
    // Electronics - Phones (Updated)
    iphone: {
      keywords: ['iphone 15', 'iphone 14', 'iphone 13', 'iphone 12', 'iphone'],
      weight: { min: 0.14, max: 0.24, typical: 0.17 },
      dimensions: { length: 15, width: 7.5, height: 0.8 }
    },
    
    android_phone: {
      keywords: ['samsung galaxy', 'pixel', 'oneplus', 'huawei', 'xiaomi', 'android phone'],
      weight: { min: 0.15, max: 0.25, typical: 0.19 },
      dimensions: { length: 16, width: 7.5, height: 0.9 }
    },
    
    // Electronics - Tablets
    ipad: {
      keywords: ['ipad pro', 'ipad air', 'ipad mini', 'ipad'],
      weight: { min: 0.29, max: 0.68, typical: 0.48 },
      dimensions: { length: 28, width: 21, height: 0.6 }
    },
    
    tablet: {
      keywords: ['tablet', 'surface pro', 'galaxy tab', 'android tablet'],
      weight: { min: 0.4, max: 0.9, typical: 0.6 },
      dimensions: { length: 26, width: 17, height: 0.8 }
    },
    
    // Electronics - Laptops (Updated)
    macbook: {
      keywords: ['macbook pro', 'macbook air', 'macbook'],
      weight: { min: 1.24, max: 2.15, typical: 1.6 },
      dimensions: { length: 35, width: 25, height: 1.6 }
    },
    
    laptop: {
      keywords: ['laptop', 'notebook', 'thinkpad', 'dell laptop', 'hp laptop', 'asus laptop', 'lenovo laptop'],
      weight: { min: 1.2, max: 3.5, typical: 2.2 },
      dimensions: { length: 36, width: 25, height: 2.0 }
    },
    
    // Electronics - Audio
    airpods: {
      keywords: ['airpods pro', 'airpods max', 'airpods'],
      weight: { min: 0.004, max: 0.38, typical: 0.05 },
      dimensions: { length: 6, width: 5, height: 2.5 }
    },
    
    headphones: {
      keywords: ['headphones', 'beats', 'sony headphones', 'bose headphones'],
      weight: { min: 0.15, max: 0.4, typical: 0.25 },
      dimensions: { length: 20, width: 18, height: 8 }
    },
    
    // Electronics - Cameras
    dslr_camera: {
      keywords: ['dslr', 'canon eos', 'nikon d', 'sony alpha'],
      weight: { min: 0.5, max: 1.5, typical: 0.8 },
      dimensions: { length: 15, width: 12, height: 8 }
    },
    
    action_camera: {
      keywords: ['gopro', 'action camera', 'sports camera'],
      weight: { min: 0.08, max: 0.15, typical: 0.12 },
      dimensions: { length: 7, width: 5, height: 3 }
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

  // Find matching category with priority for specific products
  let matchedCategory = 'default';
  let maxMatches = 0;
  let bestScore = 0;
  
  for (const [category, data] of Object.entries(productCategories)) {
    if (category === 'default') continue;
    
    const matches = data.keywords.filter(keyword => desc.includes(keyword));
    const score = matches.reduce((sum, keyword) => sum + keyword.length, 0); // Longer keywords get higher priority
    
    if (matches.length > 0 && (matches.length > maxMatches || (matches.length === maxMatches && score > bestScore))) {
      maxMatches = matches.length;
      bestScore = score;
      matchedCategory = category;
    }
  }

  const category = productCategories[matchedCategory as keyof typeof productCategories];
  
  // Add variation based on product description
  let weightMultiplier = 1;
  let sizeMultiplier = 1;
  
  // Size indicators
  if (desc.includes('mini') || desc.includes('compact') || desc.includes('small')) {
    weightMultiplier *= 0.7;
    sizeMultiplier *= 0.8;
  } else if (desc.includes('pro') || desc.includes('max') || desc.includes('plus') || desc.includes('large')) {
    weightMultiplier *= 1.2;
    sizeMultiplier *= 1.1;
  } else if (desc.includes('xl') || desc.includes('extra large')) {
    weightMultiplier *= 1.4;
    sizeMultiplier *= 1.3;
  }
  
  // Material indicators
  if (desc.includes('aluminum') || desc.includes('metal') || desc.includes('steel')) {
    weightMultiplier *= 1.1;
  } else if (desc.includes('plastic') || desc.includes('lightweight')) {
    weightMultiplier *= 0.9;
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
    confidence: maxMatches > 0 ? 'high' : 'medium',
    source: 'rule-based'
  };
}
