import { Router } from "express";
import { createBooking, getBookings, getBookingById, updateBooking, deleteBooking, getRoomBookedDates, cancelMyBooking, payForBooking, } from "../controllers/bookingController.js";
import { authenticate, requireAdmin, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
// Room booked dates availability (public)
router.get("/room/:roomId/booked-dates", getRoomBookedDates);
// Public can create a booking enquiry (no auth required)
// Optionally attach user via token if logged in
router.post("/", (req, res, next) => {
    // Try to authenticate but don't fail if no token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        authenticate(req, res, () => next());
    }
    else {
        next();
    }
}, createBooking);
router.get("/", authenticate, getBookings);
router.get("/:id", authenticate, getBookingById);
router.post("/:id/pay", authenticate, payForBooking);
router.put("/:id", authenticate, requireStaffOrAdmin, updateBooking);
router.put("/:id/cancel", authenticate, cancelMyBooking);
router.delete("/:id", authenticate, requireAdmin, deleteBooking);
export default router;
