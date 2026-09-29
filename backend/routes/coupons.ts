import { Router } from "express";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireAdmin, getCoupons);
router.post("/", authenticate, requireAdmin, createCoupon);
router.post("/validate", validateCoupon);
router.put("/:id", authenticate, requireAdmin, updateCoupon);
router.put("/:id/status", authenticate, requireAdmin, toggleCouponStatus);
router.delete("/:id", authenticate, requireAdmin, deleteCoupon);

export default router;
