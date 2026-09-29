import { Request, Response } from "express";
import pool from "../config/db.js";

// Initialize patio_bookings table
export async function initPatioTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patio_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_ref VARCHAR(50) UNIQUE NOT NULL,
        host_name VARCHAR(255) NOT NULL,
        host_email VARCHAR(255) NOT NULL,
        host_phone VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_date DATE NOT NULL,
        time_slot VARCHAR(100) NOT NULL,
        guest_count INT NOT NULL,
        food_menu_type VARCHAR(150) NOT NULL,
        special_requests TEXT,
        base_venue_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        food_price_per_head DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        estimated_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        final_quote_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        advance_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_status ENUM('pending', 'advance_paid', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(100) DEFAULT 'Pay at Desk (Cash/UPI)',
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Patio bookings table initialized.");
  } catch (error) {
    console.error("Failed to initialize patio_bookings table:", error);
  }
}

// Pricing Helper: calculates base venue fee + per-head food rate
export function calculatePatioPricing(timeSlot: string, foodMenuType: string, guestCount: number) {
  // Base venue fee depends on time slot
  let baseVenuePrice = 8500; // default evening fairy-lit
  if (timeSlot.toLowerCase().includes("lunch") || timeSlot.toLowerCase().includes("morning")) {
    baseVenuePrice = 6000;
  } else if (timeSlot.toLowerCase().includes("full day")) {
    baseVenuePrice = 12000;
  }

  // Food per person
  let foodRate = 0;
  switch (foodMenuType) {
    case "Hi-Tea & Evening Snacks":
      foodRate = 350;
      break;
    case "Traditional Banarasi Thali":
      foodRate = 650;
      break;
    case "Deluxe Celebration Buffet":
      foodRate = 850;
      break;
    case "Royal Custom Banquet":
      foodRate = 1100;
      break;
    case "Venue Only (No Food)":
    default:
      foodRate = 0;
      break;
  }

  const validGuestCount = Math.max(10, Math.min(40, guestCount || 20));
  const estimatedTotal = baseVenuePrice + foodRate * validGuestCount;

  return {
    baseVenuePrice,
    foodRate,
    guestCount: validGuestCount,
    estimatedTotal,
  };
}

// Validation Helpers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/patio/book (Public booking request)
export async function createPatioBooking(req: Request, res: Response): Promise<void> {
  try {
    const {
      host_name,
      host_email,
      host_phone,
      event_type,
      event_date,
      time_slot,
      guest_count,
      food_menu_type,
      special_requests,
    } = req.body;

    // 1. Validate Host Name
    if (!host_name || typeof host_name !== "string" || host_name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid host name (at least 2 characters).",
      });
      return;
    }
    if (host_name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Host name is too long (maximum 100 characters).",
      });
      return;
    }

    // 2. Validate Host Email
    if (!host_email || typeof host_email !== "string" || !EMAIL_REGEX.test(host_email.trim())) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
      return;
    }

    // 3. Validate Host Phone
    if (!host_phone || typeof host_phone !== "string" || !PHONE_REGEX.test(host_phone.trim())) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid 10-15 digit contact number.",
      });
      return;
    }

    // 4. Validate Event Date
    if (!event_date || typeof event_date !== "string" || !DATE_REGEX.test(event_date)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid event date in YYYY-MM-DD format.",
      });
      return;
    }

    const eventDateObj = new Date(`${event_date}T00:00:00`);
    if (isNaN(eventDateObj.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid calendar date provided.",
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDateObj < today) {
      res.status(400).json({
        success: false,
        message: "Event date cannot be in the past.",
      });
      return;
    }

    // 5. Validate Time Slot
    if (!time_slot || typeof time_slot !== "string" || !time_slot.trim()) {
      res.status(400).json({
        success: false,
        message: "Please select a valid time slot.",
      });
      return;
    }

    // 6. Validate Guest Count
    const guests = parseInt(guest_count, 10);
    if (isNaN(guests) || guests < 10 || guests > 40) {
      res.status(400).json({
        success: false,
        message: "Guest count for Open Patio must be between 10 and 40 guests.",
      });
      return;
    }

    const pricing = calculatePatioPricing(
      time_slot || "Evening Celebration (6 PM - 11 PM)",
      food_menu_type || "Deluxe Celebration Buffet",
      guests
    );

    const bookingRef = `CN-PATIO-${Date.now().toString().slice(-6)}`;

    const [result] = await pool.query(
      `INSERT INTO patio_bookings (
        booking_ref, host_name, host_email, host_phone,
        event_type, event_date, time_slot, guest_count,
        food_menu_type, special_requests,
        base_venue_price, food_price_per_head,
        estimated_total, final_quote_amount,
        status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        bookingRef,
        host_name.trim(),
        host_email.toLowerCase().trim(),
        host_phone.trim(),
        event_type || "Dinner Party",
        event_date,
        time_slot,
        pricing.guestCount,
        food_menu_type || "Deluxe Celebration Buffet",
        special_requests?.trim() || null,
        pricing.baseVenuePrice,
        pricing.foodRate,
        pricing.estimatedTotal,
        0.00, // Rate will be decided and entered directly by Admin
      ]
    );

    const insertId = (result as { insertId: number }).insertId;

    res.status(201).json({
      success: true,
      message: "Open Patio event booking enquiry submitted successfully!",
      bookingId: insertId,
      bookingRef,
    });
  } catch (error: any) {
    console.error("Create patio booking error:", error);
    res.status(500).json({
      success: false,
      message: error?.sqlMessage || error?.message || "Internal server error.",
      code: error?.code,
    });
  }
}

// GET /api/patio/bookings (Staff/Admin)
export async function getPatioBookings(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;

    let sql = "SELECT * FROM patio_bookings WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }

    if (search) {
      sql += " AND (host_name LIKE ? OR host_email LIKE ? OR host_phone LIKE ? OR booking_ref LIKE ? OR event_type LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY event_date DESC, created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, bookings: rows });
  } catch (error) {
    console.error("Get patio bookings error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/patio/bookings/:id/status (Staff/Admin)
export async function updatePatioBookingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, final_quote_amount, notes } = req.body;

    let sql = "UPDATE patio_bookings SET status = ?";
    const params: any[] = [status];

    if (final_quote_amount !== undefined) {
      sql += ", final_quote_amount = ?";
      params.push(Number(final_quote_amount));
    }

    if (notes !== undefined) {
      sql += ", special_requests = ?";
      params.push(notes);
    }

    sql += " WHERE id = ?";
    params.push(id);

    await pool.query(sql, params);
    res.json({ success: true, message: "Patio booking updated successfully." });
  } catch (error) {
    console.error("Update patio booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/patio/bookings/:id/payment (Staff/Admin)
export async function updatePatioPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { payment_status, advance_paid, payment_method } = req.body;

    await pool.query(
      `UPDATE patio_bookings SET 
        payment_status = ?,
        advance_paid = COALESCE(?, advance_paid),
        payment_method = COALESCE(?, payment_method)
       WHERE id = ?`,
      [payment_status, advance_paid, payment_method, id]
    );

    res.json({ success: true, message: "Patio payment updated successfully." });
  } catch (error) {
    console.error("Update patio payment error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/patio/bookings/:id (Staff/Admin)
export async function deletePatioBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM patio_bookings WHERE id = ?", [id]);
    res.json({ success: true, message: "Patio event booking deleted." });
  } catch (error) {
    console.error("Delete patio booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
