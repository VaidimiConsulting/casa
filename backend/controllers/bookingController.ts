import { Request, Response } from "express";
import pool from "../config/db.js";

interface BookingRow {
  id: number;
  user_id: number | null;
  room_id: number | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: Date;
  updated_at?: Date;
  room_name?: string;
  room_type?: string;
  price_per_night?: number;
  room_image?: string;
  payment_method?: string;
  transaction_id?: string;
  payment_amount?: number;
  payment_date?: Date;
}

const BOOKING_SELECT_FIELDS = `
  b.*,
  r.name AS room_name,
  r.room_type,
  r.price_per_night,
  r.image AS room_image,
  COALESCE(
    (SELECT p.payment_method FROM payments p WHERE p.booking_id = b.id ORDER BY p.id DESC LIMIT 1),
    'Pay at Reception (Cash/UPI)'
  ) AS payment_method,
  (SELECT p.transaction_id FROM payments p WHERE p.booking_id = b.id ORDER BY p.id DESC LIMIT 1) AS transaction_id,
  (SELECT p.amount FROM payments p WHERE p.booking_id = b.id ORDER BY p.id DESC LIMIT 1) AS payment_amount,
  (SELECT p.created_at FROM payments p WHERE p.booking_id = b.id ORDER BY p.id DESC LIMIT 1) AS payment_date
`;

// Validation Helpers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/bookings
export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    const {
      room_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests,
      notes,
    } = req.body;

    // 1. Validate Guest Name
    if (!guest_name || typeof guest_name !== "string" || guest_name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid guest name (at least 2 characters).",
      });
      return;
    }
    if (guest_name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Guest name is too long (maximum 100 characters).",
      });
      return;
    }

    // 2. Validate Guest Email
    if (!guest_email || typeof guest_email !== "string" || !EMAIL_REGEX.test(guest_email.trim())) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid email address (e.g., yourname@example.com).",
      });
      return;
    }

    // 3. Validate Guest Phone (if provided)
    if (guest_phone && typeof guest_phone === "string" && guest_phone.trim()) {
      if (!PHONE_REGEX.test(guest_phone.trim())) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid 10-15 digit contact number.",
        });
        return;
      }
    }

    // 4. Validate Check-in and Check-out Date Formats
    if (!check_in || !check_out || typeof check_in !== "string" || typeof check_out !== "string") {
      res.status(400).json({
        success: false,
        message: "Both check-in and check-out dates are required (format YYYY-MM-DD).",
      });
      return;
    }

    if (!DATE_REGEX.test(check_in) || !DATE_REGEX.test(check_out)) {
      res.status(400).json({
        success: false,
        message: "Dates must be in valid YYYY-MM-DD format.",
      });
      return;
    }

    const checkInDate = new Date(`${check_in}T00:00:00`);
    const checkOutDate = new Date(`${check_out}T00:00:00`);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid calendar date provided.",
      });
      return;
    }

    // Validate Check-in is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past.",
      });
      return;
    }

    // Validate Check-out is strictly after Check-in
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: "Check-out date must be at least 1 day after check-in.",
      });
      return;
    }

    // Validate Maximum Stay Duration (90 Days)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > 90) {
      res.status(400).json({
        success: false,
        message: "Maximum single reservation duration is 90 nights. For longer stays, please contact front desk.",
      });
      return;
    }

    // 5. Validate Guests Count
    const parsedGuests = parseInt(guests) || 1;
    if (parsedGuests < 1 || parsedGuests > 10) {
      res.status(400).json({
        success: false,
        message: "Guest count must be between 1 and 10.",
      });
      return;
    }

    // 6. Calculate total amount & check room conflicts
    let total_amount = 0;
    let roomRecord: any = null;

    if (room_id) {
      const [roomRows] = await pool.query(
        "SELECT id, name, price_per_night, capacity, status FROM rooms WHERE id = ?",
        [room_id]
      );
      const roomsList = roomRows as any[];
      if (roomsList.length === 0) {
        res.status(404).json({
          success: false,
          message: "The selected room was not found.",
        });
        return;
      }

      roomRecord = roomsList[0];
      if (roomRecord.status === "unavailable") {
        res.status(400).json({
          success: false,
          message: "This room is currently undergoing maintenance. Please select another room.",
        });
        return;
      }

      // Check for overlapping active bookings for this room
      const [conflicts] = await pool.query(
        `SELECT id, check_in, check_out FROM bookings 
         WHERE room_id = ? 
           AND status IN ('pending', 'confirmed') 
           AND NOT (check_out <= ? OR check_in >= ?)`,
        [room_id, check_in, check_out]
      );
      if ((conflicts as any[]).length > 0) {
        res.status(409).json({
          success: false,
          message: "This room is already reserved for the selected dates. Please choose different dates or select another room.",
        });
        return;
      }

      total_amount = Number(roomRecord.price_per_night) * nights;
    }

    // Get user_id from JWT if authenticated
    const user_id = req.user?.id || null;

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        room_id || null,
        guest_name.trim(),
        guest_email.toLowerCase().trim(),
        guest_phone?.trim() || null,
        check_in,
        check_out,
        parsedGuests,
        total_amount,
        notes?.trim() || null,
      ]
    );

    const bookingId = (result as { insertId: number }).insertId;

    // Create notification for admin dashboard
    await pool.query(
      `INSERT INTO notifications (type, title, message, link) 
       VALUES ('booking', ?, ?, ?)`,
      [
        `New Reservation: ${guest_name.trim()}`,
        `Booking #${bookingId} received for ${roomRecord?.name || "Room"} (${check_in} to ${check_out})`,
        "/admin/bookings",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Booking enquiry submitted successfully. We look forward to hosting you!",
      bookingId,
      total_amount,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}


// GET /api/bookings  (admin gets all, user gets own)
export async function getBookings(req: Request, res: Response): Promise<void> {
  try {
    let sql: string;
    let params: (string | number)[];

    if (req.user?.role === "admin" || req.user?.role === "receptionist") {
      sql = `SELECT ${BOOKING_SELECT_FIELDS}
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             ORDER BY b.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT ${BOOKING_SELECT_FIELDS}
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`;
      params = [req.user!.id];
    }

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, bookings: rows as BookingRow[] });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/bookings/:id  (protected)
export async function getBookingById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT ${BOOKING_SELECT_FIELDS}
       FROM bookings b
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ?`,
      [id]
    );
    const bookings = rows as BookingRow[];

    if (bookings.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    const booking = bookings[0];

    // Non-admin can only see own bookings
    if (req.user?.role !== "admin" && req.user?.role !== "receptionist" && booking.user_id !== req.user?.id) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/bookings/:id  (admin / staff)
export async function updateBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, payment_status, payment_method, transaction_id } = req.body;

    await pool.query(
      "UPDATE bookings SET status=COALESCE(?, status), payment_status=COALESCE(?, payment_status) WHERE id=?",
      [status, payment_status, id]
    );

    // If payment details provided or payment_status is 'paid'
    if (payment_status === "paid" || payment_method || transaction_id) {
      const [existingPay] = await pool.query("SELECT id FROM payments WHERE booking_id = ?", [id]);
      const payList = existingPay as any[];

      if (payList.length > 0) {
        await pool.query(
          "UPDATE payments SET status=COALESCE(?, status), payment_method=COALESCE(?, payment_method), transaction_id=COALESCE(?, transaction_id) WHERE booking_id=?",
          [payment_status || "paid", payment_method || null, transaction_id || null, id]
        );
      } else {
        const [bRows] = await pool.query("SELECT total_amount FROM bookings WHERE id = ?", [id]);
        const b = (bRows as any[])[0];
        if (b) {
          await pool.query(
            "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
            [
              id,
              b.total_amount,
              payment_method || "UPI",
              transaction_id || `REC-${Date.now().toString().slice(-6)}`,
              payment_status || "paid",
            ]
          );
        }
      }
    }

    res.json({ success: true, message: "Booking and payment status updated." });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/bookings/:id  (admin only)
export async function deleteBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
    res.json({ success: true, message: "Booking deleted." });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/bookings/:id/pay (customer or staff/admin pays for booking)
export async function payForBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { payment_method, transaction_id, payment_amount } = req.body;

    const [bRows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    const booking = (bRows as any[])[0];

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    // Ensure only owner or staff/admin can pay
    if (
      req.user?.role !== "admin" &&
      req.user?.role !== "receptionist" &&
      booking.user_id !== req.user?.id
    ) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }

    const finalMethod = payment_method || "UPI (Online)";
    const finalTxn = transaction_id || `CN-PAY-${Date.now().toString().slice(-7)}`;
    const finalAmount = payment_amount || booking.total_amount;

    await pool.query(
      "UPDATE bookings SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?",
      [id]
    );

    // Upsert payment
    const [existingPay] = await pool.query("SELECT id FROM payments WHERE booking_id = ?", [id]);
    if ((existingPay as any[]).length > 0) {
      await pool.query(
        "UPDATE payments SET status = 'paid', amount = ?, payment_method = ?, transaction_id = ?, updated_at = NOW() WHERE booking_id = ?",
        [finalAmount, finalMethod, finalTxn, id]
      );
    } else {
      await pool.query(
        "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, 'paid')",
        [id, finalAmount, finalMethod, finalTxn]
      );
    }

    // Insert notification
    await pool.query(
      "INSERT INTO notifications (type, title, message, link) VALUES ('booking', ?, ?, ?)",
      [
        `Payment Received: ₹${Number(finalAmount).toLocaleString()}`,
        `Payment confirmed for Booking #${id} (${booking.guest_name}) via ${finalMethod}`,
        "/admin/bookings",
      ]
    );

    res.json({
      success: true,
      message: "Payment processed successfully.",
      transaction_id: finalTxn,
      payment_method: finalMethod,
    });
  } catch (error) {
    console.error("Pay booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/bookings/room/:roomId/booked-dates (public availability)
export async function getRoomBookedDates(req: Request, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    const [rows] = await pool.query(
      `SELECT check_in, check_out, status 
       FROM bookings 
       WHERE room_id = ? 
         AND status IN ('pending', 'confirmed')
         AND check_out >= CURDATE()
       ORDER BY check_in ASC`,
      [roomId]
    );
    res.json({ success: true, bookedDates: rows });
  } catch (error) {
    console.error("Get booked dates error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/bookings/:id/cancel (customer can cancel their own booking)
export async function cancelMyBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
      [id, user_id]
    );
    const bookings = rows as any[];
    if (bookings.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    const b = bookings[0];
    if (b.status === "completed") {
      res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled." });
      return;
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ success: true, message: "Your booking enquiry has been cancelled." });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

