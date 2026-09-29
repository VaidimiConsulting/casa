import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getSettings); // Public/admin can read homestay settings
router.put("/", authenticate, requireAdmin, updateSettings);

export default router;
