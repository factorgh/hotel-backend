import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`, {
      bufferCommands: false,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error(error.message);
  }
};

export default connectDB;
// Note: Do not use the '@' symbol in your database user's password.
