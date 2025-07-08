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
  // Default search query focused on attractive deals and popular items
  let query = searchParams.get("q") || "iPhone 13 iPhone 14 iPhone 15 Samsung Galaxy S23 S24 MacBook Air PlayStation 5 Xbox Series AirPods iPad";
  // Dynamic limit: more products for homepage, fewer for searches
  const isSearch = query && query !== "iPhone 13 iPhone 14 iPhone 15 Samsung Galaxy S23 S24 MacBook Air PlayStation 5 Xbox Series AirPods iPad";
  const limit = parseInt(searchParams.get("limit") || (isSearch ? "20" : "50"));  // 20 for searches, 50 for homepage
  const offset = parseInt(searchParams.get("offset") || "0");
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

  // Enhanced category filters with intelligent search prioritization for ALL products
  if (lowerQuery.includes('gaming pc') || lowerQuery.includes('gaming laptop')) {
    filterArray.push('categoryIds:{177,175672}'); // PC Laptops & Gaming PCs
    query = `${query} -case -skin -keyboard -mouse -adapter -charger -stand -accessories`;
  } else if (lowerQuery.includes('graphics card') || lowerQuery.includes('processor') || lowerQuery.includes('cpu') || lowerQuery.includes('gpu')) {
    filterArray.push('categoryIds:{27386,164}'); // Graphics Cards & Processors
    query = `${query} -fan -cooler -case -accessories -cable`;
  } else if (lowerQuery.includes('phone') || lowerQuery.includes('smartphone') || lowerQuery.includes('iphone') || lowerQuery.includes('samsung') || lowerQuery.includes('galaxy')) {
    filterArray.push('categoryIds:{9355}'); // Cell Phones & Smartphones
    query = `${query} -case -screen -protector -cable -charger -accessories -cover -holder -mount -stand -kit -tempered -glass`;
  } else if (lowerQuery.includes('airpods') || lowerQuery.includes('earbuds') || lowerQuery.includes('headphones') || lowerQuery.includes('earphones')) {
    filterArray.push('categoryIds:{15052}'); // Portable Audio Headphones
    query = `${query} -case -stand -holder -accessories -cable -adapter`;
  } else if (lowerQuery.includes('watch') || lowerQuery.includes('smartwatch') || lowerQuery.includes('apple watch')) {
    filterArray.push('categoryIds:{178893}'); // Smart Watches
    query = `${query} -band -strap -case -screen -protector -charger -stand -accessories`;
  } else if (lowerQuery.includes('camera') || lowerQuery.includes('dslr') || lowerQuery.includes('canon') || lowerQuery.includes('nikon') || lowerQuery.includes('sony camera')) {
    filterArray.push('categoryIds:{625}'); // Digital Cameras
    query = `${query} -lens -case -bag -strap -tripod -accessories -filter -memory`;
  } else if (lowerQuery.includes('drone') || lowerQuery.includes('quadcopter')) {
    filterArray.push('categoryIds:{182186}'); // Radio Control Toys
    query = `${query} -case -bag -propeller -battery -charger -accessories -parts`;
  } else if (lowerQuery.includes('tv') || lowerQuery.includes('television') || lowerQuery.includes('smart tv')) {
    filterArray.push('categoryIds:{11071}'); // Televisions
    query = `${query} -mount -stand -remote -cable -accessories`;
  } else if (lowerQuery.includes('speaker') || lowerQuery.includes('bluetooth speaker') || lowerQuery.includes('wireless speaker')) {
    filterArray.push('categoryIds:{14969}'); // Portable Speakers
    query = `${query} -case -stand -mount -cable -accessories`;
  } else if (lowerQuery.includes('keyboard') || lowerQuery.includes('mechanical keyboard') || lowerQuery.includes('gaming keyboard')) {
    filterArray.push('categoryIds:{3676}'); // Computer Keyboards & Keypads
    query = `${query} -case -cover -wrist -rest -accessories -cable`;
  } else if (lowerQuery.includes('mouse') || lowerQuery.includes('gaming mouse') || lowerQuery.includes('wireless mouse')) {
    filterArray.push('categoryIds:{3695}'); // Computer Mice & Trackballs
    query = `${query} -pad -case -accessories -cable`;
  } else if (lowerQuery.includes('monitor') || lowerQuery.includes('gaming monitor') || lowerQuery.includes('4k monitor')) {
    filterArray.push('categoryIds:{80053}'); // Computer Monitors
    query = `${query} -stand -mount -arm -cable -accessories`;
  } else if (lowerQuery.includes('hacking') || lowerQuery.includes('rubber ducky') || lowerQuery.includes('penetration testing') || lowerQuery.includes('security')) {
    filterArray.push('categoryIds:{182094,182095,267}'); // Network Hardware & Security Devices + Books
    query = `${query} rubber ducky flipper zero wifi pineapple kali linux penetration testing ethical hacking cybersecurity books tools -case -cable -accessories`;
  } else if (lowerQuery.includes('wig') || lowerQuery.includes('hair') || lowerQuery.includes('hair extension')) {
    filterArray.push('categoryIds:{11854,175630}'); // Wigs & Hair Extensions
    query = `${query} -stand -holder -accessories -mannequin`;
  } else if (lowerQuery.includes('ps5') || lowerQuery.includes('playstation 5')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} console -controller -game -accessory -skin -stand -cable -sticker -decal -vinyl -wrap -cover -case -bag -headset -charging -dock -remote -media -disc`;
  } else if (lowerQuery.includes('ps4') || lowerQuery.includes('playstation 4')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} console -controller -game -accessory -skin -stand -cable -sticker -decal -vinyl -wrap -cover -case -bag -headset -charging -dock -remote -media -disc`;
  } else if (lowerQuery.includes('xbox series') || lowerQuery.includes('xbox one')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} console -controller -game -accessory -skin -stand -cable -sticker -decal -vinyl -wrap -cover -case -bag -headset -charging -dock -remote -media -disc`;
  } else if (lowerQuery.includes('nintendo switch') || lowerQuery.includes('switch')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} console -controller -game -accessory -skin -stand -cable -case -screen -sticker -decal -vinyl -wrap -cover -bag -headset -charging -dock`;
  } else if ((lowerQuery.includes('playstation') || lowerQuery.includes('xbox')) && !lowerQuery.includes('game')) {
    filterArray.push('categoryIds:{139971}'); // Video Game Consoles
    query = `${query} console -controller -game -accessory -skin -stand -cable -sticker -decal -vinyl -wrap -cover -case -bag -headset -charging -dock -remote -media -disc`;
  } else if (lowerQuery.includes('ps4 games') || lowerQuery.includes('ps5 games') || lowerQuery.includes('xbox games') || lowerQuery.includes('nintendo games') || lowerQuery.includes('games')) {
    filterArray.push('categoryIds:{139973}'); // Video Games
    // Don't exclude games for game searches
  } else if (lowerQuery.includes('macbook') || lowerQuery.includes('laptop') || lowerQuery.includes('notebook')) {
    filterArray.push('categoryIds:{111422,177}'); // Apple Laptops & PC Laptops
    query = `${query} -case -skin -keyboard -mouse -adapter -charger -stand -accessories -sleeve -bag`;
  } else if (lowerQuery.includes('tablet') || lowerQuery.includes('ipad')) {
    filterArray.push('categoryIds:{171485}'); // Tablets & eBook Readers
    query = `${query} -case -screen -protector -keyboard -stand -accessories -stylus -pen`;
  } else if (lowerQuery.includes('router') || lowerQuery.includes('wifi router') || lowerQuery.includes('modem')) {
    filterArray.push('categoryIds:{182094}'); // Network Hardware
    query = `${query} -cable -antenna -accessories`;
  } else if (lowerQuery.includes('printer') || lowerQuery.includes('3d printer') || lowerQuery.includes('inkjet')) {
    filterArray.push('categoryIds:{617}'); // Printers
    query = `${query} -ink -cartridge -paper -cable -accessories`;
  } else if (lowerQuery.includes('hard drive') || lowerQuery.includes('ssd') || lowerQuery.includes('storage')) {
    filterArray.push('categoryIds:{175669}'); // Computer Hard Drives
    query = `${query} -case -enclosure -cable -accessories`;
  } else if (lowerQuery.includes('power bank') || lowerQuery.includes('portable charger') || lowerQuery.includes('battery pack')) {
    filterArray.push('categoryIds:{20349}'); // Power Banks
    query = `${query} -case -cable -accessories`;
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

    // Light post-processing: Only filter out very obvious cheap accessories when sorting by price
    if (data.itemSummaries && (sortBy === 'priceAsc' || sortBy === 'priceDesc')) {
      const filteredItems = data.itemSummaries.filter((item: any) => {
        const title = item.title?.toLowerCase() || '';
        const price = parseFloat(item.price?.value || '0');
        
        // Only filter out very obvious cheap accessories
        let shouldFilter = false;
        
        // For PS5 searches, only filter out very cheap stickers/decals
        if (lowerQuery.includes('ps5') || lowerQuery.includes('playstation')) {
          if ((title.includes('sticker') || title.includes('decal')) && price < 3) {
            shouldFilter = true;
          }
        }
        
        // For general searches, only filter out extremely cheap obvious accessories
        if (price < 2 && (title.includes('sticker') || title.includes('decal'))) {
          shouldFilter = true;
        }
        
        // Return true if item should NOT be filtered (keep the item)
        return !shouldFilter;
      });
      
      console.log(`eBay API returned ${data.itemSummaries.length} items, filtered to ${filteredItems.length} relevant items`);
      data.itemSummaries = filteredItems;
    } else {
      console.log("eBay API returned items:", data.itemSummaries.length);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in eBay API route:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
