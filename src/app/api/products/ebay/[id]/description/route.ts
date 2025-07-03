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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = decodeURIComponent(params.id);

    const token = await getAccessToken();

    const res = await fetch(`https://api.ebay.com/buy/browse/v1/item/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch product description:", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to fetch product description" },
        { status: res.status }
      );
    }

    const product = await res.json();
    return NextResponse.json({ 
      description: product.description || "No description available."
    });
  } catch (error) {
    console.error("Error fetching product description:", error);
    return NextResponse.json(
      { error: "Unexpected error fetching description" },
      { status: 500 }
    );
  }
}
