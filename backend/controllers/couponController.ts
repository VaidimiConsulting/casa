import { Request, Response } from "express";
import pool from "../config/db.js";

// GET /api/coupons
export async function getCoupons(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json({ success: true, coupons: rows });
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/coupons
export async function createCoupon(req: Request, res: Response): Promise<void> {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      start_date,
      end_date,
      is_active,
    } = req.body;

    if (!code || !discount_value || !start_date || !end_date) {
      res.status(400).json({ success: false, message: "Code, discount value, start date and end date are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        description || null,
        discount_type || "percentage",
        discount_value,
        min_order_amount || 0,
        max_discount || null,
        start_date,
        end_date,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Coupon created.",
      couponId: (result as { insertId: number }).insertId,
    });
  } catch (error: any) {
    console.error("Create coupon error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ success: false, message: "Coupon code already exists." });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/coupons/:id
export async function updateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      start_date,
      end_date,
      is_active,
    } = req.body;

    await pool.query(
      `UPDATE coupons 
       SET code=?, description=?, discount_type=?, discount_value=?, min_order_amount=?, max_discount=?, start_date=?, end_date=?, is_active=?
       WHERE id=?`,
      [
        code.toUpperCase(),
        description || null,
        discount_type || "percentage",
        discount_value,
        min_order_amount || 0,
        max_discount || null,
        start_date,
        end_date,
        is_active ? 1 : 0,
        id,
      ]
    );

    res.json({ success: true, message: "Coupon updated." });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/coupons/:id/status
export async function toggleCouponStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, id]);
    res.json({ success: true, message: "Coupon status updated." });
  } catch (error) {
    console.error("Toggle coupon status error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/coupons/:id
export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM coupons WHERE id = ?", [id]);
    res.json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/coupons/validate
export async function validateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { code, amount } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: "Coupon code is required." });
      return;
    }

    const [rows] = await pool.query(
      "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= CURDATE() AND end_date >= CURDATE()",
      [code.toUpperCase()]
    );
    const coupons = rows as any[];

    if (coupons.length === 0) {
      res.status(400).json({ success: false, message: "Invalid or expired coupon code." });
      return;
    }

    const coupon = coupons[0];
    const orderAmount = Number(amount) || 0;

    if (orderAmount < Number(coupon.min_order_amount)) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`,
      });
      return;
    }

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (orderAmount * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discount > Number(coupon.max_discount)) {
        discount = Number(coupon.max_discount);
      }
    } else {
      discount = Number(coupon.discount_value);
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
