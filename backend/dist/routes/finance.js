import express from "express";
import { getFinanceSummary, getExpenses, addExpense, deleteExpense } from "../controllers/financeController.js";
const router = express.Router();
router.get("/summary", getFinanceSummary);
router.get("/expenses", getExpenses);
router.post("/expenses", addExpense);
router.delete("/expenses/:id", deleteExpense);
export default router;
