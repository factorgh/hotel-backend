// db.js or connectDB.js
import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables");
  }

  // Optional: log URI for debugging (mask credentials)
  console.log("Connecting to MongoDB...");

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connection established");

    // Setup additional listeners for better monitoring
    mongoose.connection.on("error", (err) =>
      console.error("❌ MongoDB connection error:", err)
    );

    mongoose.connection.on("disconnected", () =>
      console.warn("⚠️ MongoDB disconnected")
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit the app if DB connection fails
  }
};

export default connectDB;
