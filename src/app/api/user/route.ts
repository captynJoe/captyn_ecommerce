import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new NextResponse("Missing email or password", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      email,
      hashedPassword,
    });

    return new NextResponse("User created successfully", { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
