import { NextResponse } from "next/server";

export async function GET() {
  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    const { ObjectId } = await import("mongodb");
    
    const client = await clientPromise;
    const db = client.db("your_database_name");
    const collection = db.collection("users");

    // Example: Find user by email or _id
    const user = await collection.findOne({ email: "joel@example.com" });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Destructure to remove password before sending response
    const { password, ...safeUser } = user;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const data = await req.json();
    
    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    const { ObjectId } = await import("mongodb");
    
    const client = await clientPromise;
    const db = client.db("your_database_name");
    const collection = db.collection("users");

    // Example: update by user id
    const userId = data._id;
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Build update doc, but never update password here directly (for demo)
    const updateData = { ...data };
    delete updateData.password;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = result.value;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database operation failed" }, { status: 503 });
  }
}
