import { Router } from "express";
import {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getLoans,
  issueBook,
  returnBook,
  getUserLoans,
} from "../controllers/libraryController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

// ==========================================
// Public routes
// ==========================================
router.get("/books", getBooks);
router.get("/books/:id", getBookById);

// ==========================================
// User authenticated routes
// ==========================================
router.get("/my-loans", authenticate, getUserLoans);

// ==========================================
// Staff / Admin routes
// ==========================================
router.post("/books", authenticate, requireStaffOrAdmin, addBook);
router.put("/books/:id", authenticate, requireStaffOrAdmin, updateBook);
router.delete("/books/:id", authenticate, requireStaffOrAdmin, deleteBook);

router.get("/loans", authenticate, requireStaffOrAdmin, getLoans);
router.post("/loans", authenticate, requireStaffOrAdmin, issueBook);
router.put("/loans/:id/return", authenticate, requireStaffOrAdmin, returnBook);

export default router;
