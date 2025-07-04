import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
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
}

export async function PUT(req: Request) {
  const data = await req.json();
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
}
