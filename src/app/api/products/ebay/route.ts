import { NextResponse } from "next/server";

const clientId = process.env.EBAY_CLIENT_ID!;
const clientSecret = process.env.EBAY_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!res.ok) {
    console.error("Failed to get eBay access token:", res.status, await res.text());
    throw new Error("Failed to get eBay access token");
  }

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
  return accessToken;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100");  // Increased default limit
  const offset = parseInt(searchParams.get("offset") || "0");
  // Default search query focused on flagship products
  let query = searchParams.get("q") || "iPhone 14 Pro, iPhone 15 Pro, Samsung Galaxy S23 Ultra, PlayStation 5, MacBook Pro";
  const sortBy = searchParams.get("sortBy") || "bestMatch";

  let token;
  try {
    if (!clientId || !clientSecret) {
      console.error("Missing eBay API credentials");
      return NextResponse.json({ 
        error: "Configuration error", 
        details: "eBay API credentials are not properly configured"
      }, { status: 500 });
    }

    token = await getAccessToken();
    console.log("Successfully obtained eBay access token");
  } catch (error) {
    console.error("Error getting access token:", error);
    return NextResponse.json({ 
      error: "Failed to get access token",
      details: error instanceof Error ? error.message : "Unknown error occurred while getting access token"
    }, { status: 500 });
  }

  // Build filter array
  const filterArray: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Add category filters and specific exclusions based on product type
  if (lowerQuery.includes('gaming pc') || lowerQuery.includes('gaming laptop')) {
    filterArray.push('categoryIds:{177,175672}'); // PC Laptops & Gaming PCs
    query = `${query} -case -skin -keyboard -mouse -adapter -charger -stand -accessories`;
  } else if (lowerQuery.includes('graphics card') || lowerQuery.includes('processor')) {
    filterArray.push('categoryIds:{27386,164}'); // Graphics Cards & Processors
    query = `${query} -fan -cooler -case -accessories`;
  } else if (lowerQuery.includes('phone') || lowerQuery.includes('smartphone')) {
    filterArray.push('categoryIds:{9355}'); // Cell Phones & Smartphones
    query = `${query} -case -screen -protector -cable -charger -accessories -cover -holder -mount -stand -kit`;
  } else if (lowerQuery.includes('hacking') || lowerQuery.includes('rubber ducky')) {
    filterArray.push('categoryIds:{182094,182095}'); // Network Hardware & Security Devices
    query = `${query} -case -cable -accessories`;
  } else if (lowerQuery.includes('wig') || lowerQuery.includes('hair')) {
    filterArray.push('categoryIds:{11854,175630}'); // Wigs & Hair Extensions
    query = `${query} -stand -holder -accessories`;
  } else if (lowerQuery.includes('playstation') || lowerQuery.includes('ps5') || lowerQuery.includes('xbox')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} -controller -game -accessory -skin -stand -cable`;
  } else if (lowerQuery.includes('macbook') || lowerQuery.includes('laptop')) {
    filterArray.push('categoryIds:{111422,177}'); // Apple Laptops & PC Laptops
    query = `${query} -case -skin -keyboard -mouse -adapter -charger -stand -accessories`;
  }

  // Add condition filter if specified
  const conditionMap: { [key: string]: string } = {
    new: "NEW",
    refurbished: "CERTIFIED_REFURBISHED,SELLER_REFURBISHED",
    "very good": "VERY_GOOD",
    good: "GOOD",
    used: "USED",
    "for parts": "FOR_PARTS_OR_NOT_WORKING"
  };

  const condition = searchParams.get("condition");
  if (condition && condition !== "all" && conditionMap[condition]) {
    filterArray.push(`conditions:{${conditionMap[condition]}}`);
  }

  // Add price range filter if specified
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const priceFilter = `price:[${minPrice || '*'}..${maxPrice || '*'}],priceCurrency:USD`;
    filterArray.push(priceFilter);
  }

  // Add minimum price filter to exclude very cheap accessories/parts
  if (!minPrice) {
    const minPriceMap: { [key: string]: number } = {
      playstation: 200,
      ps5: 200,
      xbox: 200,
      macbook: 300,
      laptop: 200,
      iphone: 100,
      samsung: 100,
      default: 50
    };

    const productType = Object.keys(minPriceMap).find(key => lowerQuery.includes(key)) || 'default';
    filterArray.push(`price:[${minPriceMap[productType]}..*],priceCurrency:USD`);
  }

  // Add location filter for all products
  filterArray.push('itemLocationCountry:US');

  // Convert sort parameter - use valid eBay sort values
  const sortMap: { [key: string]: string } = {
    bestMatch: "",  // Default sort, no parameter needed
    priceAsc: "price",
    priceDesc: "-price",
    newlyListed: "-startTime",
    endingSoon: "endingSoonest"
  };

  const sortParam = sortMap[sortBy] || "";
  
  // Build the API URL with all parameters
  const apiUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  apiUrl.searchParams.append("q", query);
  apiUrl.searchParams.append("limit", limit.toString());
  apiUrl.searchParams.append("offset", offset.toString());
  
  if (sortParam) {
    apiUrl.searchParams.append("sort", sortParam);
  }
  
  if (filterArray.length > 0) {
    apiUrl.searchParams.append("filter", filterArray.join(','));
  }

  const ebayRes = await fetch(apiUrl.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY-US",
        "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=US",
      },
    }
  );

  try {
    if (!ebayRes.ok) {
      const errorText = await ebayRes.text();
      console.error("eBay API request failed:", ebayRes.status, errorText);
      
      // Check for specific error conditions
      if (ebayRes.status === 401) {
        return NextResponse.json({ 
          error: "Authentication failed. Please check eBay API credentials.",
          details: errorText 
        }, { status: 401 });
      }
      
      if (ebayRes.status === 429) {
        return NextResponse.json({ 
          error: "eBay API rate limit exceeded. Please try again later.",
          details: errorText 
        }, { status: 429 });
      }

      return NextResponse.json({ 
        error: "eBay API request failed", 
        details: errorText,
        status: ebayRes.status
      }, { status: ebayRes.status });
    }

    // Get response text first to check if it's valid JSON
    const responseText = await ebayRes.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse eBay API response as JSON:", responseText.substring(0, 500));
      return NextResponse.json({ 
        error: "Invalid response format from eBay API",
        details: "The eBay API returned an invalid JSON response"
      }, { status: 502 });
    }
    
    if (!data.itemSummaries) {
      console.warn("No items found in eBay API response:", data);
      return NextResponse.json({ 
        itemSummaries: [],
        total: 0,
        message: "No items found for this search"
      });
    }

    console.log("eBay API returned items:", data.itemSummaries.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in eBay API route:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
