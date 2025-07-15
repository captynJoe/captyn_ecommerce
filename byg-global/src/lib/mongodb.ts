import dotenv from "dotenv";
import path from "path";
import { MongoClient } from "mongodb";

dotenv.config({ path: path.resolve(process.cwd(), "byg-global/.env.local") });

const uri = process.env.MONGODB_URI;
console.log("Loaded MONGODB_URI:", uri ? "Yes" : "No");

const options = {};

// Helper function for delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry logic for MongoDB connection with exponential backoff
async function connectWithRetry(client: MongoClient, retries = 5, delayMs = 1000): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      console.log("MongoDB connected successfully");
      return client;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        const backoff = delayMs * Math.pow(2, i);
        console.log(`Retrying in ${backoff}ms...`);
        await delay(backoff);
      } else {
        console.error("All MongoDB connection attempts failed.");
        throw error;
      }
    }
  }
  throw new Error("MongoDB connection failed after retries");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = connectWithRetry(client);
    }
    clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = connectWithRetry(client);
  }
} else {
  clientPromise = Promise.reject(new Error("MONGODB_URI environment variable is not defined"));
}

/**
 * Note: If you encounter DNS resolution errors like "querySrv ECONNREFUSED",
 * please check your network and DNS settings. MongoDB Atlas uses DNS SRV records,
 * so your environment must support DNS SRV queries.
 * Also, ensure no firewall or VPN is blocking access to mongodb.net domains.
 */

export default clientPromise;
