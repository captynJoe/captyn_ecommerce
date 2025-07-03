import { NextResponse } from "next/server";

const clientId = process.env.EBAY_CLIENT_ID!;
const clientSecret = process.env.EBAY_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken() {
  try {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    console.log("Requesting new eBay access token...");
    
    if (!clientId || !clientSecret) {
      throw new Error("eBay credentials not configured");
    }

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
      throw new Error(`Failed to get eBay access token: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    
    if (!data.access_token) {
      console.error("Invalid token response:", data);
      throw new Error("Invalid token response from eBay");
    }

    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early
    console.log("Successfully obtained new eBay access token");
    return accessToken;
  } catch (error) {
    console.error("Error getting eBay access token:", error);
    throw error;
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = decodeURIComponent(params.id);

    console.log("Fetching product with ID:", id);

    const token = await getAccessToken();

    const res = await fetch(`https://api.ebay.com/buy/browse/v1/item/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("eBay API error:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch product details", details: errorText },
        { status: res.status }
      );
    }

    const product = await res.json();
    console.log("Product fetched successfully:", product.title);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Unexpected error in product API:", error);
    return NextResponse.json(
      { error: "Unexpected error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
