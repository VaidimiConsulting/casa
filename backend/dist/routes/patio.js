import { Router } from "express";
import { createPatioBooking, getPatioBookings, updatePatioBookingStatus, updatePatioPayment, deletePatioBooking, } from "../controllers/patioController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
// Public route: Guest submits patio booking request
router.post("/book", createPatioBooking);
// Staff / Admin protected routes
router.get("/bookings", authenticate, requireStaffOrAdmin, getPatioBookings);
router.put("/bookings/:id/status", authenticate, requireStaffOrAdmin, updatePatioBookingStatus);
router.put("/bookings/:id/payment", authenticate, requireStaffOrAdmin, updatePatioPayment);
router.delete("/bookings/:id", authenticate, requireStaffOrAdmin, deletePatioBooking);
export default router;
