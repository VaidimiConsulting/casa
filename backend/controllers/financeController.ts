import { Request, Response } from "express";
import pool from "../config/db.js";

// Initialize expenses table
export async function initFinanceTable(): Promise<void> {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        expense_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTableSql);
    console.log("✅ Expenses table checked/created.");
  } catch (error) {
    console.error("Init finance table error:", error);
  }
}

// GET /api/finance/summary
// Returns current month's/day's income, expenses, and net income
export async function getFinanceSummary(req: Request, res: Response): Promise<void> {
  try {
    const { month, year, day } = req.query;
    
    // Default to current month/year if not provided
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();
    const targetDay = day ? Number(day) : null;

    let dateFilterBooking = "MONTH(created_at) = ? AND YEAR(created_at) = ?";
    let dateFilterPayment = "MONTH(created_at) = ? AND YEAR(created_at) = ?";
    let dateFilterExpense = "MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
    let params: any[] = [targetMonth, targetYear];

    if (targetDay) {
      dateFilterBooking += " AND DAY(created_at) = ?";
      dateFilterPayment += " AND DAY(created_at) = ?";
      dateFilterExpense += " AND DAY(expense_date) = ?";
      params.push(targetDay);
    }

    // 1. Calculate Income
    // 1a. Income from Bookings
    const [bookingRows] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM bookings 
       WHERE payment_status = 'paid' 
       AND ${dateFilterBooking}`,
      params
    );
    const bookingIncome = Number((bookingRows as any[])[0]?.total || 0);

    // 1b. Income from Direct Payments (No booking associated)
    const [directPaymentRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM payments 
       WHERE booking_id IS NULL 
       AND status = 'paid' 
       AND ${dateFilterPayment}`,
      params
    );
    const directPaymentIncome = Number((directPaymentRows as any[])[0]?.total || 0);

    const totalIncome = bookingIncome + directPaymentIncome;

    // 2. Calculate Expenses
    const [expenseRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expense 
       FROM expenses 
       WHERE ${dateFilterExpense}`,
      params
    );
    const totalExpense = Number((expenseRows as any[])[0]?.total_expense || 0);

    // 3. Net Income
    const netIncome = totalIncome - totalExpense;

    res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      day: targetDay,
      summary: {
        totalIncome,
        totalExpense,
        netIncome
      }
    });
  } catch (error) {
    console.error("Get finance summary error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/finance/expenses
export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const { month, year, day } = req.query;
    
    let sql = "SELECT * FROM expenses";
    const params: any[] = [];
    let conditions: string[] = [];

    if (month && year) {
      conditions.push("MONTH(expense_date) = ? AND YEAR(expense_date) = ?");
      params.push(Number(month), Number(year));
      
      if (day) {
        conditions.push("DAY(expense_date) = ?");
        params.push(Number(day));
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY expense_date DESC, created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, expenses: rows });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/finance/expenses
export async function addExpense(req: Request, res: Response): Promise<void> {
  try {
    const { title, amount, category, expense_date, description } = req.body;

    if (!title || !amount || !expense_date) {
      res.status(400).json({ success: false, message: "Title, amount, and date are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (title, amount, category, expense_date, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, amount, category || "General", expense_date, description || ""]
    );

    const newId = (result as { insertId: number }).insertId;

    res.status(201).json({ 
      success: true, 
      message: "Expense added successfully.",
      expense: {
        id: newId,
        title,
        amount,
        category: category || "General",
        expense_date,
        description: description || ""
      }
    });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/finance/expenses/:id
export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM expenses WHERE id = ?", [id]);
    res.json({ success: true, message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
