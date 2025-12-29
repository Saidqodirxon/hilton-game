import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// MongoDB connection
export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export const db = mongoose.connection;
