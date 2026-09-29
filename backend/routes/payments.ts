import { Router } from "express";
import {
  getPayments,
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  updateBookingPaymentStatus,
  getRazorpayConfig,
  validatePaymentRequest,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

// Middleware for optional authentication
const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    authenticate(req, res, () => next());
  } else {
    next();
  }
};

// ============================================================
// Razorpay Gateway 3-Step Flow: Validate -> Initiate -> Confirm
// ============================================================
router.get("/razorpay/config", getRazorpayConfig);

// 1. VALIDATE: Check booking status, amount, and room readiness
router.post("/razorpay/validate", optionalAuth, validatePaymentRequest);

// 2. INITIATE: Create official Razorpay order with unique receipt & paise calculation
router.post("/razorpay/initiate", optionalAuth, createRazorpayOrder);
router.post("/razorpay/create-order", optionalAuth, createRazorpayOrder);

// 3. CONFIRM: HMAC-SHA256 signature verification & update booking status to PAID
router.post("/razorpay/confirm", optionalAuth, verifyRazorpayPayment);
router.post("/razorpay/verify", optionalAuth, verifyRazorpayPayment);

// Standard Payment Management Endpoints
router.get("/", authenticate, requireStaffOrAdmin, getPayments);
router.post("/", authenticate, requireStaffOrAdmin, createPayment);
router.get("/:id", authenticate, getPaymentById);
router.put("/:id/status", authenticate, requireStaffOrAdmin, updatePaymentStatus);
router.put("/booking/:bookingId/status", authenticate, requireStaffOrAdmin, updateBookingPaymentStatus);

export default router;


