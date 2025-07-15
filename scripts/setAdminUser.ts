import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "byg-global/.env.local") });

async function setAdminUser(email: string) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db();
    const users = database.collection("users");

    const result = await users.updateOne(
      { email: email },
      { $set: { isAdmin: true } }
    );

    if (result.matchedCount === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      console.log(`User with email ${email} is now an admin.`);
    }
  } catch (error) {
    console.error("Error setting admin user:", error);
  } finally {
    await client.close();
  }
}

// Replace with the email of the user you want to make admin
const adminEmail = "captynglobal@gmail.com";

setAdminUser(adminEmail);
