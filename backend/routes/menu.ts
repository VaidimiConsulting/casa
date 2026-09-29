import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuAvailability,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

// Categories
router.get("/categories", getCategories);
router.post("/categories", authenticate, requireStaffOrAdmin, createCategory);
router.put("/categories/:id", authenticate, requireStaffOrAdmin, updateCategory);
router.delete("/categories/:id", authenticate, requireStaffOrAdmin, deleteCategory);

// Menu items
router.get("/items", getMenuItems);
router.post("/items", authenticate, requireStaffOrAdmin, createMenuItem);
router.put("/items/:id", authenticate, requireStaffOrAdmin, updateMenuItem);
router.put("/items/:id/availability", authenticate, requireStaffOrAdmin, toggleMenuAvailability);
router.delete("/items/:id", authenticate, requireStaffOrAdmin, deleteMenuItem);

export default router;
