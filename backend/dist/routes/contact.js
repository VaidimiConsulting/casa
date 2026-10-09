import { Router } from "express";
import { createContactMessage, getContactMessages, updateContactStatus, deleteContactMessage, } from "../controllers/contactController.js";
import { authenticate, requireAdmin, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
router.post("/", createContactMessage);
router.get("/", authenticate, requireStaffOrAdmin, getContactMessages);
router.put("/:id", authenticate, requireStaffOrAdmin, updateContactStatus);
router.delete("/:id", authenticate, requireAdmin, deleteContactMessage);
export default router;
