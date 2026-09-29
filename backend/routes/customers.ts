import { Router } from "express";
import { getCustomers, getCustomerDetails } from "../controllers/customerController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireStaffOrAdmin, getCustomers);
router.get("/:id", authenticate, requireStaffOrAdmin, getCustomerDetails);

export default router;
