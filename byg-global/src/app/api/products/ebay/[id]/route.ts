import { NextResponse } from "next/server";

const clientId = process.env.EBAY_CLIENT_ID!;
const clientSecret = process.env.EBAY_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiry = 0;

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

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = decodeURIComponent(params.id);

  if (!id) {
    return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
  }

  let token;
  try {
    if (!clientId || !clientSecret) {
      console.error("Missing eBay API credentials");
      return NextResponse.json({
        error: "Configuration error",
        details: "eBay API credentials are not properly configured",
      }, { status: 500 });
    }

    token = await getAccessToken();
  } catch (error) {
    console.error("Error getting access token:", error);
    return NextResponse.json({
      error: "Failed to get access token",
      details: error instanceof Error ? error.message : "Unknown error occurred while getting access token",
    }, { status: 500 });
  }

  const apiUrl = `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY-US",
        "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=US",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("eBay API request failed:", res.status, errorText);
      return NextResponse.json({
        error: "eBay API request failed",
        details: errorText,
        status: res.status,
      }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch product details from eBay API:", error);
    return NextResponse.json({
      error: "Failed to fetch product details",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
