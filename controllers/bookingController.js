import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { paystackWebhooks } from "./paystackWebhooks.js";
import { generateReference } from "../utils/referenceGenerator.js";
import { initializePaystackPayment } from "../utils/common.js";

// Check room availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;

    const existingBooking = await Booking.findOne({
      room,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    });

    res.json({
      success: true,
      isAvailable: !existingBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create booking
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests, paymentMethod } = req.body;
    const user = req.user;

    // 1. Get room details
    const roomData = await Room.findById(room);
    if (!roomData)
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });

    // 2. Calculate amount
    const nights = Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
    );
    const amount = roomData.pricePerNight * nights;

    // 3. Generate reference
    const reference = generateReference();

    // 4. Create booking
    const booking = await Booking.create({
      room,
      user: user._id,
      checkInDate,
      checkOutDate,
      guests: +guests,
      paymentMethod,
      totalPrice: amount,
      hotel: roomData.hotel,
      paymentStatus: "pending",
      reference,
      paymentReference: reference,
      paymentAmount: amount,
      paymentCurrency: process.env.CURRENCY || "GHS",
    });

    // 5. If Paystack, initialize transaction immediately
    let paystackInitData = null;
    if (paymentMethod === "Paystack") {
      paystackInitData = await initializePaystackPayment({
        email: user.email,
        amount: amount * 100, // Paystack works in pesewas/kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL}/my-bookings`,
      });
    }

    res.json({
      success: true,
      booking,
      paystack: paystackInitData || null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookings (admin only)
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("room")
      .populate("user", "name email");
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("room")
      .populate("user", "name email");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update booking status (admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete booking (admin only)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Paystack payment initialization
export const paystackPayment = async (req, res) => {
  try {
    const { bookingId, email } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      amount: booking.amount,
      currency: booking.currency,
      reference: booking.reference,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    const booking = await Booking.findOne({ reference });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    booking.paymentStatus = "paid";
    await booking.save();

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User booking
export const getUserBookings = async (req, res) => {
  console.log(req.user);
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate(
      "room"
    );
    // .populate("user", "name email");
    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
