import { Request, Response } from "express";
import pool from "../config/db.js";

// Validation Helpers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

// POST /api/contact
export async function createContactMessage(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, subject, message } = req.body;

    // 1. Validate Name
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid name (at least 2 characters).",
      });
      return;
    }
    if (name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Name is too long (maximum 100 characters).",
      });
      return;
    }

    // 2. Validate Email
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
      return;
    }

    // 3. Validate Phone (if provided)
    if (phone && typeof phone === "string" && phone.trim()) {
      if (!PHONE_REGEX.test(phone.trim())) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid 10-15 digit phone number.",
        });
        return;
      }
    }

    // 4. Validate Message
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: "Please provide a message with at least 5 characters.",
      });
      return;
    }
    if (message.trim().length > 3000) {
      res.status(400).json({
        success: false,
        message: "Message is too long (maximum 3000 characters).",
      });
      return;
    }

    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone?.trim() || null,
        subject?.trim() || null,
        message.trim(),
      ]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (type, title, message, link)
       VALUES ('message', ?, ?, '/admin/messages')`,
      [`New message from ${name}`, subject || message.slice(0, 40)]
    );

    res.status(201).json({
      success: true,
      message: "Thank you for your message. We will get back to you shortly.",
    });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/contact  (admin only)
export async function getContactMessages(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;
    let sql = "SELECT * FROM contact_messages WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }
    if (search) {
      sql += " AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, messages: rows });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/contact/:id  (admin only)
export async function updateContactStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    if (status && !["unread", "read", "replied"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status. Use: unread, read, replied." });
      return;
    }

    let sql = "UPDATE contact_messages SET status = ?";
    const params: any[] = [status || "read"];

    if (reply !== undefined) {
      sql += ", reply = ?";
      params.push(reply);
    }

    sql += " WHERE id = ?";
    params.push(id);

    await pool.query(sql, params);
    res.json({ success: true, message: "Status updated." });
  } catch (error) {
    console.error("Update contact error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/contact/:id (admin only)
export async function deleteContactMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM contact_messages WHERE id = ?", [id]);
    res.json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
