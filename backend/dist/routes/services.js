import { Router } from "express";
import { getServices, createService, updateServiceStatus, deleteService, } from "../controllers/serviceController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/", authenticate, requireStaffOrAdmin, getServices);
router.post("/", authenticate, requireStaffOrAdmin, createService);
router.put("/:id/status", authenticate, requireStaffOrAdmin, updateServiceStatus);
router.delete("/:id", authenticate, requireStaffOrAdmin, deleteService);
export default router;
