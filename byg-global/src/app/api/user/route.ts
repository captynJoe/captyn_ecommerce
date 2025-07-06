import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("users");

    const user = await collection.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data before sending response
    const { hashedPassword, ...safeUser } = user;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const data = await req.json();
    
    if (!data.email || !data.name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("users");

    // Check if user already exists
    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create new user
    const newUser = {
      email: data.email,
      name: data.name,
      firebaseUid: data.firebaseUid,
      createdAt: data.createdAt || new Date().toISOString(),
      searchHistory: data.searchHistory || [],
      preferences: {
        currency: 'KES',
        language: 'en',
        notifications: true,
      },
    };

    const result = await collection.insertOne(newUser);

    return NextResponse.json({ 
      success: true, 
      userId: result.insertedId,
      message: "User created successfully" 
    });

  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const data = await req.json();
    
    // Dynamic import to prevent build errors when MongoDB isn't configured
    const { default: clientPromise } = await import("@/lib/mongodb");
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("users");

    // Build update doc, exclude sensitive fields
    const updateData = { ...data };
    delete updateData.hashedPassword;
    delete updateData._id;
    delete updateData.email; // Don't allow email changes
    
    updateData.updatedAt = new Date().toISOString();

    const result = await collection.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { hashedPassword, ...safeUser } = result.value;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database operation failed" }, { status: 503 });
  }
}
