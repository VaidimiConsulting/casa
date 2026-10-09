import { Router } from "express";
import { getReviews, createReview, toggleReviewApproval, deleteReview, } from "../controllers/reviewController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/", getReviews); // Public gets reviews (or filtered)
router.post("/", createReview);
router.put("/:id/approval", authenticate, requireStaffOrAdmin, toggleReviewApproval);
router.delete("/:id", authenticate, requireStaffOrAdmin, deleteReview);
export default router;
