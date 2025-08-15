import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getOwnerRooms,
  toggleRoomAvailability,
} from "../controllers/roomController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const roomRouter = express.Router();

// Public routes
roomRouter.get("/", getRooms);
roomRouter.get("/:id", getRoomById);

// Protected routes
roomRouter.use(protect);

// GET rooms for current user (admin only)
roomRouter.get("/owner", admin, getOwnerRooms);

// POST create room (admin only)
roomRouter.post("/", upload.array("images", 5), protect, createRoom);

// PUT update room (admin only)
roomRouter.put("/:id", admin, updateRoom);

// DELETE room (admin only)
roomRouter.delete("/:id", admin, deleteRoom);

// POST toggle availability (admin only)
roomRouter.post("/:id/toggle-availability", admin, toggleRoomAvailability);

export default roomRouter;
