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
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const isSearch = query && query !== "";
    const limit = parseInt(searchParams.get("limit") || (isSearch ? "150" : "100"));
    const offset = parseInt(searchParams.get("offset") || "0");
    const isHomepage = !searchParams.get("q") || searchParams.get("q") === "";
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

    if (!query) {
      return NextResponse.json({
        itemSummaries: [],
        total: 0,
        message: "No search query provided",
      });
    }

    if (!clientId || !clientSecret) {
      console.error("Missing eBay API credentials");
      return NextResponse.json({ 
        error: "Configuration error", 
        details: "eBay API credentials are not properly configured"
      }, { status: 500 });
    }
    token = await getAccessToken();
    console.log("Successfully obtained eBay access token");

    const sortMap: { [key: string]: string } = {
      priceAsc: "price+asc",
      priceDesc: "price+desc",
      bestMatch: "bestMatch",
      endingSoon: "endingSoon"
    };

    const sortParam = sortMap[sortBy] || "bestMatch";

    const apiUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    apiUrl.searchParams.append("q", query);
    apiUrl.searchParams.append("limit", limit.toString());
    apiUrl.searchParams.append("offset", offset.toString());
    if (sortParam && sortParam !== "bestMatch") {
      apiUrl.searchParams.append("sort", sortParam);
    }

    console.log("Sort param being sent to eBay:", sortParam);
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

        let data;
        try {
          data = await ebayRes.json();
        } catch (parseError) {
          console.error("Failed to parse eBay API response as JSON:", parseError);
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

        // Filtering logic
        if (data.itemSummaries.length > 0) {
          data.itemSummaries = data.itemSummaries.filter((item: EbayItemSummary) => {
            const title = (item.title || "").toLowerCase();
            const description = (item.description || "").toLowerCase();
            const priceValue = parseFloat(item.price?.value || "0");
            const currency = item.price?.currency || "USD";
            const priceInKsh = currency === "USD" ? priceValue * 130 : priceValue;
            const sellerSoldCount = item.seller?.feedbackScore || 0;

            if ((!item.description || item.description.trim() === "") && sellerSoldCount < 10) return false;

            const prohibitedKeywords = ["gun", "guns", "sex doll", "sex dolls"];
            if (prohibitedKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) return false;

            const accessoryKeywords = [
              "phone cover", "phone case", "screen protector", "screen guard", "tempered glass", "protector film",
              "phone skin", "phone wrap", "case", "cover", "protector", "skin", "wrap", "sticker", "decal"
            ];
            const isAccessory = accessoryKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
            const phoneCoverKeywords = [
              "phone cover", "phone case", "screen protector", "screen guard", "tempered glass", "protector film"
            ];
            const isPhoneCover = phoneCoverKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));

            if (sortBy === "priceAsc" && minPriceUSD !== undefined) {
              const minPriceKsh = minPriceUSD * 130;
              if (isPhoneCover && priceInKsh < minPriceKsh) return false;
              if (priceInKsh < minPriceKsh) return false;
            }

            if (sortBy === "priceAsc" || sortBy === "priceDesc") {
              const queryKeywords = lowerQuery.split(/\s+/).filter(k => k.length > 0);
              const matchesAllKeywords = queryKeywords.every(keyword => title.includes(keyword) || description.includes(keyword));
              const matchesExactPhrase = title.includes(lowerQuery) || description.includes(lowerQuery);
              const queryIsAccessory = accessoryKeywords.some(keyword => lowerQuery.includes(keyword));
              if (!queryIsAccessory && isAccessory) return false;
              if (!matchesAllKeywords && !matchesExactPhrase) return false;
            }

            return true;
          });
        }

        // Remove very cheap accessories for price sorting
        if (data.itemSummaries && (sortBy === "priceAsc" || sortBy === "priceDesc")) {
          data.itemSummaries = data.itemSummaries.filter((item: EbayItemSummary) => {
            const title = item.title?.toLowerCase() || "";
            const price = parseFloat(item.price?.value || "0");
            if ((lowerQuery.includes("ps5") || lowerQuery.includes("playstation")) &&
                (title.includes("sticker") || title.includes("decal")) && price < 3) return false;
            if (price < 2 && (title.includes("sticker") || title.includes("decal"))) return false;
            return true;
          });
        }

        // Final sort by price in backend for reliability
        if (data.itemSummaries && (sortParam === "price+asc" || sortParam === "price+desc")) {
          data.itemSummaries = data.itemSummaries.sort((a: EbayItemSummary, b: EbayItemSummary) => {
            const priceA = parseFloat(a.price?.value || "0");
            const priceB = parseFloat(b.price?.value || "0");
            return sortParam === "price+asc"
              ? priceA - priceB
              : priceB - priceA;
          });
          console.log("Products sorted in backend by price:", sortParam);
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
  } catch (error) {
    console.error("Unexpected error in GET handler:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
  }
