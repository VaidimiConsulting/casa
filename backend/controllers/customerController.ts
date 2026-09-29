import { Request, Response } from "express";
import pool from "../config/db.js";

// GET /api/customers
export async function getCustomers(req: Request, res: Response): Promise<void> {
  try {
    const { search } = req.query;

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) +
        COALESCE(SUM(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN food_orders o ON u.id = o.user_id
      WHERE u.role = 'user'
    `;
    const params: any[] = [];

    if (search) {
      sql += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " GROUP BY u.id ORDER BY u.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, customers: rows });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/customers/:id
export async function getCustomerDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const [userRows] = await pool.query(
      "SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    const users = userRows as any[];

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }

    const customer = users[0];

    // Customer bookings
    const [bookings] = await pool.query(
      `SELECT b.*, r.name as room_name 
       FROM bookings b 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = ? OR b.guest_email = ?
       ORDER BY b.created_at DESC`,
      [id, customer.email]
    );

    // Customer food orders
    const [orders] = await pool.query(
      `SELECT * FROM food_orders 
       WHERE user_id = ? OR customer_email = ?
       ORDER BY created_at DESC`,
      [id, customer.email]
    );

    // Payments
    const [payments] = await pool.query(
      `SELECT p.*, b.guest_name 
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       WHERE b.user_id = ? OR b.guest_email = ?
       ORDER BY p.created_at DESC`,
      [id, customer.email]
    );

    res.json({
      success: true,
      customer: {
        ...customer,
        bookings,
        orders,
        payments,
      },
    });
  } catch (error) {
    console.error("Get customer details error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
