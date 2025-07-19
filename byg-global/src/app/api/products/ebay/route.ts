import { NextResponse } from "next/server";

const clientId = process.env.EBAY_CLIENT_ID!;
const clientSecret = process.env.EBAY_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiry = 0;

interface EbayItemSummary {
  title?: string;
  description?: string;
  price?: {
    value?: string;
    currency?: string;
  };
  seller?: {
    feedbackScore?: number;
  };
}

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown = null;

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
  const query = searchParams.get("q") || "phone laptop gaming console electronics";
  const isSearch = query && query !== "phone laptop gaming console electronics";
  const limit = parseInt(searchParams.get("limit") || (isSearch ? "150" : "100"));
  const offset = parseInt(searchParams.get("offset") || "0");
  const isHomepage = !searchParams.get("q") || searchParams.get("q") === "phone laptop gaming console electronics";
  let sortBy = searchParams.get("sortBy") || (isHomepage ? "bestMatch" : "bestMatch");

  // Read minPrice parameter from searchParams (in USD)
  const minPriceParam = searchParams.get("minPrice");
  const minPriceUSD = minPriceParam ? parseFloat(minPriceParam) : undefined;

  const lowerQuery = query.toLowerCase();

  const validSortKeys = ["bestMatch", "priceAsc", "priceDesc", "endingSoon"];
  if (!validSortKeys.includes(sortBy)) {
    console.warn(`Invalid sortBy value '${sortBy}' received, falling back to 'bestMatch'`);
    sortBy = "bestMatch";
  }

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

  const sortMap: { [key: string]: string } = {
    priceAsc: "price",
    priceDesc: "priceDesc",
    bestMatch: "bestMatch"
  };
  
  const sortParam = sortMap[sortBy] || "bestMatch";
  
  const apiUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  apiUrl.searchParams.append("q", query);
  apiUrl.searchParams.append("limit", limit.toString());
  apiUrl.searchParams.append("offset", offset.toString());
  
  if (sortParam && sortParam !== "bestMatch") {
    apiUrl.searchParams.append("sort", sortParam);
  }
  
  console.log("eBay API request URL:", apiUrl.toString());
  
  let ebayRes;
  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown = null;
  
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

      const responseText = await ebayRes.text();

      // Added detailed logging for debugging priceAsc sorting
      if (sortBy === "priceAsc") {
        console.log("Raw eBay API response for priceAsc sorting:", responseText.substring(0, 2000));
      }

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

      // Filter products: exclude guns, sex dolls, low-priced items except phone covers/cases
      // Allow items with no description only if seller has at least 10 sold items
      if (data.itemSummaries.length > 0) {
        console.log("Filtering products for description, prohibited items, and price...");
        data.itemSummaries = data.itemSummaries.filter((item: EbayItemSummary) => {
          const title = (item.title || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          const priceValue = parseFloat(item.price?.value || "0");
          const currency = item.price?.currency || "USD";
          const priceInKsh = currency === "USD" ? priceValue * 130 : priceValue;
          const sellerSoldCount = item.seller?.feedbackScore || 0;

          if ((!item.description || item.description.trim() === "") && sellerSoldCount < 10) {
            console.log(`Filtered out product with no description and low seller sales: '${item.title}'`);
            return false;
          }

          const prohibitedKeywords = ["gun", "guns", "sex doll", "sex dolls"];
          if (prohibitedKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
            console.log(`Filtered out prohibited product: '${item.title}'`);
            return false;
          }

          const accessoryKeywords = [
            "phone cover",
            "phone case",
            "screen protector",
            "screen guard",
            "tempered glass",
            "protector film",
            "phone skin",
            "phone wrap"
          ];
          const isAccessory = accessoryKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
          // Define isPhoneCover for filtering phone covers/cases and screen protectors
          const phoneCoverKeywords = [
            "phone cover",
            "phone case",
            "screen protector",
            "screen guard",
            "tempered glass",
            "protector film"
          ];
          const isPhoneCover = phoneCoverKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
          // Removed 4000 Ksh price filter block as per user request
          console.log(`Product passed filter: '${item.title}' priced at ${priceInKsh} Ksh, isAccessory: ${isAccessory}, isPhoneCover: ${isPhoneCover}`);

          // New filter: exclude products cheaper than minPriceUSD when sorting by priceAsc
          if (sortBy === "priceAsc" && minPriceUSD !== undefined) {
            // Convert minPriceUSD to Ksh for comparison
            const minPriceKsh = minPriceUSD * 130;

            // Additional check: exclude phone covers/cases and screen protectors below minPriceKsh
            if (isPhoneCover && priceInKsh < minPriceKsh) {
              console.log(`Filtered out phone cover/case or screen protector below minPrice filter: '${item.title}' priced at ${priceInKsh} Ksh, minPrice is ${minPriceKsh} Ksh`);
              return false;
            }

            if (priceInKsh < minPriceKsh) {
              console.log(`Filtered out product below minPrice filter: '${item.title}' priced at ${priceInKsh} Ksh, minPrice is ${minPriceKsh} Ksh`);
              return false;
            }
          }

          // Additional filtering to ensure relevance to search query when sorting by price
          if (sortBy === "priceAsc" || sortBy === "priceDesc") {
            // Split query into keywords
            const queryKeywords = lowerQuery.split(/\s+/).filter(k => k.length > 0);
            // Check if any keyword is present in title or description
            const matchesKeyword = queryKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
            if (!matchesKeyword) {
              console.log(`Filtered out unrelated product in price sorting: '${item.title}' does not match query keywords`);
              return false;
            }
          }

          return true;
        });
        console.log("Total items after filtering:", data.itemSummaries.length);
      }

      // Light post-processing: filter out very cheap accessories when sorting by price
      if (data.itemSummaries && (sortBy === "priceAsc" || sortBy === "priceDesc")) {
        const filteredItems = data.itemSummaries.filter((item: EbayItemSummary) => {
          const title = item.title?.toLowerCase() || "";
          const price = parseFloat(item.price?.value || "0");

          let shouldFilter = false;

          if (lowerQuery.includes("ps5") || lowerQuery.includes("playstation")) {
            if ((title.includes("sticker") || title.includes("decal")) && price < 3) {
              shouldFilter = true;
            }
          }

          if (price < 2 && (title.includes("sticker") || title.includes("decal"))) {
            shouldFilter = true;
          }

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
