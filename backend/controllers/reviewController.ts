import { Request, Response } from "express";
import pool from "../config/db.js";

export async function initReviewsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NULL,
        rating INT NOT NULL DEFAULT 5,
        review TEXT NOT NULL,
        room_id INT NULL,
        room_name VARCHAR(255) NULL,
        is_approved TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure room_name column exists if table already existed
    try {
      await pool.query("ALTER TABLE reviews ADD COLUMN room_name VARCHAR(255) NULL");
    } catch {
      // Column already exists
    }

    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM reviews");
    if (rows[0].count === 0) {
      console.log("⭐ Reviews table is ready.");
    }
  } catch (err) {
    console.error("Reviews table init error:", err);
  }
}
initReviewsTable();

// GET /api/reviews
export async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    await initReviewsTable();
    const { approvedOnly } = req.query;
    let sql = `
      SELECT rev.id, rev.user_id, rev.customer_name, rev.customer_email, rev.rating, rev.review, rev.room_id,
             COALESCE(rev.room_name, r.name, 'Casa Nest Homestay') as room_name,
             rev.is_approved, rev.created_at
      FROM reviews rev
      LEFT JOIN rooms r ON rev.room_id = r.id
      WHERE 1=1
    `;
    if (approvedOnly === "true") {
      sql += " AND rev.is_approved = 1";
    }
    sql += " ORDER BY rev.created_at DESC";

    const [rows] = await pool.query(sql);
    res.json({ success: true, reviews: rows });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/reviews
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, customer_name, customer_email, rating, review, room_id, room_name } = req.body;

    if (!customer_name || !rating || !review) {
      res.status(400).json({ success: false, message: "Name, rating and review text are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, customer_name, customer_email, rating, review, room_id, room_name, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [user_id || null, customer_name.trim(), customer_email ? customer_email.trim() : null, Number(rating), review.trim(), room_id || null, room_name || null]
    );

    res.status(201).json({
      success: true,
      message: "Review submitted.",
      reviewId: (result as { insertId: number }).insertId,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/reviews/:id/approval
export async function toggleReviewApproval(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    await pool.query("UPDATE reviews SET is_approved = ? WHERE id = ?", [is_approved ? 1 : 0, id]);
    res.json({ success: true, message: "Review status updated." });
  } catch (error) {
    console.error("Toggle review approval error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/reviews/:id
export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

