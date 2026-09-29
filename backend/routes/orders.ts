import { Router } from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireStaffOrAdmin, getOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/", createOrder); // Public or authenticated customer / staff can place orders
router.put("/:id/status", authenticate, requireStaffOrAdmin, updateOrderStatus);
router.put("/:id/payment", authenticate, requireStaffOrAdmin, updateOrderPaymentStatus);
router.delete("/:id", authenticate, requireStaffOrAdmin, deleteOrder);

export default router;
