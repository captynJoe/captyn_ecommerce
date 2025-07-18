import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchQuery } = await req.json();
    
    if (!searchQuery || typeof searchQuery !== 'string') {
      return NextResponse.json({ error: "Invalid search query" }, { status: 400 });
    }

    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Update user's search history
    await usersCollection.updateOne(
      { email: session.user.email },
      {
        $push: {
          searchHistory: {
            query: searchQuery.toLowerCase().trim(),
            timestamp: new Date(),
          }
        },
        $slice: { searchHistory: -20 } // Keep only last 20 searches
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Search history error:", error);
    return NextResponse.json({ error: "Failed to save search history" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ searchHistory: [] });
    }

    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { email: session.user.email },
      { projection: { searchHistory: 1 } }
    );

    const searchHistory = user?.searchHistory || [];
    
    // Get recent unique search terms
    const recentSearches = searchHistory
      .slice(-10) // Last 10 searches
  .map((item: { query: string }) => item.query)
  .filter((query: string, index: number, arr: string[]) => arr.indexOf(query) === index) // Remove duplicates
      .reverse(); // Most recent first

    return NextResponse.json({ searchHistory: recentSearches });
  } catch (error) {
    console.error("Get search history error:", error);
    return NextResponse.json({ searchHistory: [] });
  }
}
