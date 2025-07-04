import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { User } from "next-auth";
import { WithId } from "mongodb";
import bcrypt from "bcrypt";

interface UserDocument extends WithId<Document> {
  email: string;
  hashedPassword: string;
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const client = await clientPromise;
        const usersCollection = client.db().collection("users");

        const user = await usersCollection.findOne({ email: credentials.email }) as UserDocument | null;

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid credentials");
        }

       const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword);

if (!isPasswordValid) {
  throw new Error("Invalid credentials");
}

        return {
          id: user._id.toString(),
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
