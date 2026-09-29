import { Router } from "express";
import { getDashboardStats, getReports, getNotifications } from "../controllers/adminController.js";
import { authenticate, requireAdmin, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", authenticate, requireStaffOrAdmin, getDashboardStats);
router.get("/reports", authenticate, requireAdmin, getReports);
router.get("/notifications", authenticate, requireStaffOrAdmin, getNotifications);

export default router;
