import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectDB(): Promise<Db> {
  // age connect thakle seta-i return korbo
  if (database) {
    return database;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env file");
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db();

  return database;
}

// 4 ta collection er helper

export async function usersCollection() {
  const db = await connectDB();
  return db.collection("users");
}

export async function tuitionsCollection() {
  const db = await connectDB();
  return db.collection("tuitions");
}

export async function applicationsCollection() {
  const db = await connectDB();
  return db.collection("applications");
}

export async function paymentsCollection() {
  const db = await connectDB();
  return db.collection("payments");
}