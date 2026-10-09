import { Router } from "express";
import { getPayments, createPayment, getPaymentById, updatePaymentStatus, updateBookingPaymentStatus, } from "../controllers/paymentController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
// Middleware for optional authentication
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        authenticate(req, res, () => next());
    }
    else {
        next();
    }
};
// Standard Payment Management Endpoints
router.get("/", authenticate, requireStaffOrAdmin, getPayments);
router.post("/", authenticate, requireStaffOrAdmin, createPayment);
router.get("/:id", authenticate, getPaymentById);
router.put("/:id/status", authenticate, requireStaffOrAdmin, updatePaymentStatus);
router.put("/booking/:bookingId/status", authenticate, requireStaffOrAdmin, updateBookingPaymentStatus);
export default router;
