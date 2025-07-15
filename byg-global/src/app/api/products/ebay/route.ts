import allowedSellers from "@/config/allowedSellers";
import { NextResponse } from "next/server";

console.log("Allowed sellers at runtime:", allowedSellers);

const clientId = process.env.EBAY_CLIENT_ID!;
const clientSecret = process.env.EBAY_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const maxRetries = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to get eBay access token:", res.status, errorText);
        throw new Error("Failed to get eBay access token");
      }

      const data = await res.json();
      accessToken = data.access_token;
      tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
      return accessToken;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} to get eBay access token failed:`, error);
      attempt++;
      if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt);
        console.log(`Retrying getAccessToken in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  console.error("All attempts to get eBay access token failed.");
  throw lastError;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Default search query focused on popular items that are likely to have results
  let query = searchParams.get("q") || "phone laptop gaming console electronics";
  // Dynamic limit: more products for homepage, fewer for searches
  const isSearch = query && query !== "phone laptop gaming console electronics";
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

  // No category filters

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
    // eBay API expects price filter in format price:[min..max]
    // and priceCurrency filter separately
    if (minPrice && maxPrice) {
      filterArray.push(`price:[${minPrice}..${maxPrice}]`);
    } else if (minPrice) {
      filterArray.push(`price:[${minPrice}..*]`);
    } else if (maxPrice) {
      filterArray.push(`price:[*..${maxPrice}]`);
    }
    filterArray.push("priceCurrency:USD");
  }

  // Add location filter for all products
  filterArray.push('itemLocationCountry:US');

  // Add seller filter for allowed sellers
  if (allowedSellers.length > 0) {
    // eBay API expects sellers filter as sellers:{seller1|seller2}
    filterArray.push(`sellers:{${allowedSellers.join('|')}}`);

  } else {
    // If no sellers are allowed, return an empty list of products
    return NextResponse.json({
      itemSummaries: [],
      total: 0,
      message: "No sellers are allowed"
    });
  }

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
    const filterString = filterArray.join(',');
    apiUrl.searchParams.append("filter", encodeURIComponent(filterString));
  }

  let ebayRes;
  const maxRetries = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      ebayRes = await fetch(apiUrl.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-EBAY-C-MARKETPLACE-ID": "EBAY-US",
          "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=US",
        },
      });

      if (!ebayRes.ok) {
        const errorText = await ebayRes.text();
        console.error("eBay API request failed:", ebayRes.status, errorText);

        // Check for specific error conditions
        if (ebayRes.status === 401) {
          return NextResponse.json({
            error: "Authentication failed. Please check eBay API credentials.",
            details: errorText,
          }, { status: 401 });
        }

        if (ebayRes.status === 429) {
          return NextResponse.json({
            error: "eBay API rate limit exceeded. Please try again later.",
            details: errorText,
          }, { status: 429 });
        }

        return NextResponse.json({
          error: "eBay API request failed",
          details: errorText,
          status: ebayRes.status,
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
          details: "The eBay API returned an invalid JSON response",
        }, { status: 502 });
      }

      if (!data.itemSummaries) {
        console.warn("No items found in eBay API response:", data);
        return NextResponse.json({
          itemSummaries: [],
          total: 0,
          message: "No items found for this search",
        });
      }

      // Server-side filter: Only keep products from allowed sellers
      if (allowedSellers.length > 0) {
        data.itemSummaries = data.itemSummaries.filter((item: any) => {
          const sellerUsername = item.seller?.username?.toLowerCase() || "";
          return allowedSellers.some(seller => seller.toLowerCase() === sellerUsername);
        });
      }

      // Light post-processing: Only filter out very obvious cheap accessories when sorting by price
      if (data.itemSummaries && (sortBy === "priceAsc" || sortBy === "priceDesc")) {
        const filteredItems = data.itemSummaries.filter((item: any) => {
          const title = item.title?.toLowerCase() || "";
          const price = parseFloat(item.price?.value || "0");

          // Only filter out very obvious cheap accessories
          let shouldFilter = false;

          // For PS5 searches, only filter out very cheap stickers/decals
          if (lowerQuery.includes("ps5") || lowerQuery.includes("playstation")) {
            if ((title.includes("sticker") || title.includes("decal")) && price < 3) {
              shouldFilter = true;
            }
          }

          // For general searches, only filter out extremely cheap obvious accessories
          if (price < 2 && (title.includes("sticker") || title.includes("decal"))) {
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
      lastError = error;
      console.error(`Attempt ${attempt + 1} to fetch eBay API failed:`, error);
      attempt++;
      if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt);
        console.log(`Retrying eBay API fetch in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  console.error("All attempts to fetch eBay API failed.");
  return NextResponse.json({
    error: "Failed to fetch eBay API",
    details: lastError instanceof Error ? lastError.message : "Unknown error",
  }, { status: 500 });
}
