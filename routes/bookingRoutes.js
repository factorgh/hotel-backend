import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
  deleteBooking,
  checkAvailabilityAPI,
  paystackPayment,
  verifyPayment,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { verifyPaystackWebhook } from "../controllers/paystackWebhooks.js";

const router = express.Router();

// Webhook for Paystack
router.post(
  "/paystack-webhook",
  express.raw({ type: "application/json" }),
  verifyPaystackWebhook
);

// Public routes
router.post("/check-availability", checkAvailabilityAPI);

// Protected Routes
router.use(protect);

// GET all bookings (admin only)
router.get(
  "/",
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    next();
  },
  getBookings
);

// GET user bookings
router.get("/user", protect, getUserBookings);
// GET booking by ID
router.get("/:id", getBookingById);

// POST create booking
router.post("/", createBooking);

// POST Paystack payment
router.post("/paystack-payment", paystackPayment);

// POST verify payment
router.post("/verify-payment", verifyPayment);

// PUT update booking status (admin only)
router.put(
  "/:id/status",
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    next();
  },
  updateBookingStatus
);

// DELETE booking (admin only)
router.delete(
  "/:id",
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    next();
  },
  deleteBooking
);

export default router;
