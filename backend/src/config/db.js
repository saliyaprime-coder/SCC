import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      process.env.MONGO_URL;

    if (!uri) {
      console.error(
        "MongoDB connection failed: no URI provided. Set MONGO_URI (or MONGODB_URI / DATABASE_URL / MONGO_URL) in a .env or environment."
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
