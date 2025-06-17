import { NextResponse } from "next/server";

// In-memory user data (will reset on server restart)
let user = {
  id: 1,
  name: "Joel",
  email: "joel@example.com",
  address: "Nairobi, Kenya",
  phone: "+254700000000",
  avatar: "",
  createdAt: "2023-01-01T12:00:00Z",
  orders: [{ id: 1 }, { id: 2 }],
  bio: "I love shopping on BYG Global!",
  password: "secret", // For demo only! Never store plain passwords in production.
};

export async function GET() {
  // Never send password to client
  const { password, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT(req: Request) {
  const data = await req.json();

  // Update user fields
  user = {
    ...user,
    ...data,
    password: data.password ? data.password : user.password, // update if provided
  };

  // Never send password to client
  const { password, ...safeUser } = user;
  return NextResponse.json(safeUser);
}