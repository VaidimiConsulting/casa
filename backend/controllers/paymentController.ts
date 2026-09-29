import { Request, Response } from "express";
import crypto from "crypto";
import pool from "../config/db.js";
import {
  razorpayInstance,
  isRazorpayConfigured,
  getRazorpayKeyId,
  getRazorpayKeySecret,
} from "../config/razorpay.js";

// Initialize and ensure payments table schema is up to date
export async function initPaymentsTable(): Promise<void> {
  try {
    const [cols]: any = await pool.query("SHOW COLUMNS FROM payments LIKE 'customer_name'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE payments ADD COLUMN customer_name VARCHAR(100) DEFAULT NULL AFTER booking_id");
      console.log("✅ Added customer_name column to payments table.");
    }
    await pool.query("ALTER TABLE payments MODIFY COLUMN booking_id INT UNSIGNED DEFAULT NULL");
  } catch (error) {
    console.error("Init payments table error:", error);
  }
}

// GET /api/payments (admin)
export async function getPayments(req: Request, res: Response): Promise<void> {

  try {
    const { status, search } = req.query;

    const baseSql = `
      SELECT 
        COALESCE(p.id, 0) AS id,
        b.id AS booking_id,
        COALESCE(b.guest_name, p.customer_name, 'Guest') AS customer_name,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.check_in,
        b.check_out,
        b.guests,
        COALESCE(r.name, 'Casa Nest Suite') AS room_name,
        COALESCE(p.amount, b.total_amount, 0) AS amount,
        b.total_amount,
        COALESCE(p.payment_method, 'Pay at Reception (Cash/UPI)') AS payment_method,
        COALESCE(p.transaction_id, CONCAT('CN-BK-', b.id)) AS transaction_id,
        CASE 
          WHEN b.payment_status = 'paid' OR p.status = 'paid' THEN 'paid'
          WHEN p.status = 'refunded' THEN 'refunded'
          WHEN p.status = 'failed' THEN 'failed'
          ELSE 'pending'
        END AS status,
        COALESCE(p.created_at, b.created_at) AS created_at,
        b.status AS booking_status
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN (
        SELECT p1.*
        FROM payments p1
        INNER JOIN (
          SELECT booking_id, MAX(id) as max_id
          FROM payments
          WHERE booking_id IS NOT NULL
          GROUP BY booking_id
        ) p2 ON p1.id = p2.max_id
      ) p ON p.booking_id = b.id
      WHERE b.status != 'cancelled'

      UNION ALL

      SELECT
        p.id AS id,
        NULL AS booking_id,
        p.customer_name,
        p.customer_name AS guest_name,
        NULL AS guest_email,
        NULL AS guest_phone,
        NULL AS check_in,
        NULL AS check_out,
        1 AS guests,
        'Direct Desk Payment' AS room_name,
        p.amount,
        p.amount AS total_amount,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.created_at,
        'confirmed' AS booking_status
      FROM payments p
      WHERE p.booking_id IS NULL
    `;

    let sql = `SELECT * FROM (${baseSql}) AS all_payments WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }

    if (search) {
      sql += " AND (customer_name LIKE ? OR guest_email LIKE ? OR guest_phone LIKE ? OR transaction_id LIKE ? OR room_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, payments: rows });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/payments
export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const { booking_id, customer_name, amount, payment_method, transaction_id, status } = req.body;

    if (!amount) {
      res.status(400).json({ success: false, message: "Amount is required." });
      return;
    }

    const txnId = transaction_id || `REC-${Date.now().toString().slice(-6)}`;
    const payStatus = status || "paid";

    const [result] = await pool.query(
      `INSERT INTO payments (booking_id, customer_name, amount, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        booking_id || null,
        customer_name || null,
        amount,
        payment_method || "Cash",
        txnId,
        payStatus,
      ]
    );

    const paymentId = (result as { insertId: number }).insertId;

    if (booking_id && payStatus === "paid") {
      await pool.query(
        "UPDATE bookings SET payment_status='paid', status=IF(status='cancelled', 'cancelled', 'confirmed') WHERE id=?",
        [booking_id]
      );
    }

    res.status(201).json({ success: true, message: "Payment recorded.", paymentId, transaction_id: txnId });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/payments/:id/status
export async function updatePaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (Number(id) > 0) {
      await pool.query("UPDATE payments SET status = ? WHERE id = ?", [status, id]);
      const [rows] = await pool.query("SELECT booking_id FROM payments WHERE id = ?", [id]);
      const payRows = rows as { booking_id: number | null }[];
      if (payRows.length > 0 && payRows[0].booking_id) {
        await pool.query("UPDATE bookings SET payment_status = ? WHERE id = ?", [
          status === "paid" ? "paid" : "pending",
          payRows[0].booking_id,
        ]);
      }
    }
    res.json({ success: true, message: "Payment status updated." });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/payments/booking/:bookingId/status
export async function updateBookingPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { bookingId } = req.params;
    const { status, payment_method } = req.body;

    await pool.query("UPDATE bookings SET payment_status = ? WHERE id = ?", [
      status === "paid" ? "paid" : "pending",
      bookingId,
    ]);

    const [existing] = await pool.query("SELECT id FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1", [bookingId]);
    const existingRows = existing as { id: number }[];

    if (existingRows.length > 0) {
      await pool.query("UPDATE payments SET status = ?, payment_method = COALESCE(?, payment_method) WHERE id = ?", [
        status,
        payment_method || null,
        existingRows[0].id,
      ]);
    } else {
      const [bRows] = await pool.query("SELECT guest_name, total_amount FROM bookings WHERE id = ?", [bookingId]);
      const bList = bRows as { guest_name: string; total_amount: number }[];
      if (bList.length > 0) {
        await pool.query(
          `INSERT INTO payments (booking_id, customer_name, amount, payment_method, transaction_id, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            bookingId,
            bList[0].guest_name,
            bList[0].total_amount || 0,
            payment_method || "Cash at Reception",
            `REC-${Date.now().toString().slice(-6)}`,
            status || "paid",
          ]
        );
      }
    }

    res.json({ success: true, message: "Payment status updated successfully." });
  } catch (error) {
    console.error("Update booking payment status error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/payments/:id
export async function getPaymentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, b.guest_name, b.guest_email
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       WHERE p.id = ?`,
      [id]
    );
    const payments = rows as object[];

    if (payments.length === 0) {
      res.status(404).json({ success: false, message: "Payment not found." });
      return;
    }

    res.json({ success: true, payment: payments[0] });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/payments/razorpay/config (Get Razorpay Public Key ID & status)
export async function getRazorpayConfig(req: Request, res: Response): Promise<void> {
  try {
    const keyId = getRazorpayKeyId();
    const configured = isRazorpayConfigured();
    res.json({
      success: true,
      key_id: keyId,
      is_configured: configured,
      currency: "INR",
      company_name: "Casa Nest Homestay & Restaurant",
      description: "Homestay & Room Booking in Varanasi",
    });
  } catch (error) {
    console.error("Razorpay config error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// 1. VALIDATE: POST /api/payments/razorpay/validate (Pre-Payment Validation)
export async function validatePaymentRequest(req: Request, res: Response): Promise<void> {
  try {
    const { booking_id, amount: customAmount } = req.body;

    if (!booking_id && (!customAmount || Number(customAmount) <= 0)) {
      res.status(400).json({
        success: false,
        valid: false,
        message: "Valid booking_id or positive amount is required for validation.",
      });
      return;
    }

    let bookingData: any = null;
    let finalAmount = Number(customAmount) || 0;
    let roomName = "Casa Nest Homestay";
    let guestName = "Guest";
    let guestEmail = "";
    let guestPhone = "";

    if (booking_id) {
      const [bRows] = await pool.query(
        `SELECT b.*, r.name AS room_name, r.price_per_night, r.image AS room_image
         FROM bookings b 
         LEFT JOIN rooms r ON b.room_id = r.id 
         WHERE b.id = ?`,
        [booking_id]
      );
      const bList = bRows as any[];
      if (bList.length === 0) {
        res.status(404).json({
          success: false,
          valid: false,
          message: "Booking record not found.",
        });
        return;
      }

      const b = bList[0];
      if (b.status === "cancelled") {
        res.status(400).json({
          success: false,
          valid: false,
          message: "Cannot initiate payment for a cancelled booking.",
        });
        return;
      }

      if (b.payment_status === "paid") {
        res.status(400).json({
          success: false,
          valid: false,
          already_paid: true,
          message: "This booking is already fully paid.",
        });
        return;
      }

      finalAmount = finalAmount > 0 ? finalAmount : Number(b.total_amount);
      roomName = b.room_name || "Casa Nest Suite";
      guestName = b.guest_name || "Guest";
      guestEmail = b.guest_email || "";
      guestPhone = b.guest_phone || "";
      bookingData = b;
    }

    if (finalAmount <= 0) {
      res.status(400).json({
        success: false,
        valid: false,
        message: "Calculated payable amount must be greater than zero.",
      });
      return;
    }

    const amountInPaise = Math.round(finalAmount * 100);

    res.json({
      success: true,
      valid: true,
      stage: "validated",
      booking_id: booking_id || null,
      payable_amount: finalAmount,
      amount_paise: amountInPaise,
      currency: "INR",
      room_name: roomName,
      customer: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      },
      gateway_ready: true,
      is_configured: isRazorpayConfigured(),
    });
  } catch (error) {
    console.error("Validate payment error:", error);
    res.status(500).json({ success: false, valid: false, message: "Internal server validation error." });
  }
}

// 2. INITIATE: POST /api/payments/razorpay/initiate or /create-order (Create Gateway Order)
export async function createRazorpayOrder(req: Request, res: Response): Promise<void> {
  try {
    const { booking_id, amount: customAmount } = req.body;

    let finalAmount = Number(customAmount) || 0;
    let roomName = "Casa Nest Room";
    let guestName = "Guest";
    let guestEmail = "";
    let guestPhone = "";

    if (booking_id) {
      const [bRows] = await pool.query(
        `SELECT b.*, r.name AS room_name 
         FROM bookings b 
         LEFT JOIN rooms r ON b.room_id = r.id 
         WHERE b.id = ?`,
        [booking_id]
      );
      const bookingList = bRows as any[];
      if (bookingList.length === 0) {
        res.status(404).json({ success: false, message: "Booking record not found." });
        return;
      }
      const b = bookingList[0];
      finalAmount = finalAmount > 0 ? finalAmount : Number(b.total_amount);
      roomName = b.room_name || "Casa Nest Suite";
      guestName = b.guest_name || "Guest";
      guestEmail = b.guest_email || "";
      guestPhone = b.guest_phone || "";
    }

    if (!finalAmount || finalAmount <= 0) {
      res.status(400).json({ success: false, message: "A valid positive payment amount is required." });
      return;
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(finalAmount * 100);
    const receiptId = `rcpt_${booking_id ? `bk_${booking_id}` : `dir_${Date.now()}`}`;

    if (isRazorpayConfigured() && razorpayInstance) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: receiptId.slice(0, 40),
          notes: {
            booking_id: booking_id ? String(booking_id) : "",
            room_name: roomName,
            guest_name: guestName,
            guest_email: guestEmail,
          },
        });

        res.json({
          success: true,
          stage: "initiated",
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: getRazorpayKeyId(),
          booking_id,
          room_name: roomName,
          customer: {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
          },
          is_mock: false,
        });
        return;
      } catch (rzpErr: any) {
        console.error("Razorpay API Order creation error:", rzpErr);
      }
    }

    // Simulated / Test order fallback when live credentials are not yet populated
    const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    res.json({
      success: true,
      stage: "initiated",
      order_id: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      key_id: getRazorpayKeyId(),
      booking_id,
      room_name: roomName,
      customer: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      },
      is_mock: true,
      message: "Order initiated (Test Mode). Add actual Razorpay credentials in backend .env to switch to live gateway.",
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize payment gateway order." });
  }
}

// 3. CONFIRM: POST /api/payments/razorpay/confirm or /verify (Verify Signature & Confirm)
export async function verifyRazorpayPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
      amount,
      payment_method,
    } = req.body;

    if (!razorpay_payment_id) {
      res.status(400).json({ success: false, message: "Razorpay payment ID is required." });
      return;
    }

    // Verify signature if live credentials are configured
    if (isRazorpayConfigured() && razorpay_signature && razorpay_order_id) {
      const secret = getRazorpayKeySecret();
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        res.status(400).json({
          success: false,
          message: "Payment signature verification failed. Untrusted transaction.",
        });
        return;
      }
    }

    const payMethod = payment_method || "Razorpay (Online / UPI / Card)";
    let bookingAmount = Number(amount) || 0;
    let guestName = "Guest";
    let roomName = "Casa Nest Room";

    // Update booking if booking_id provided
    if (booking_id) {
      const [bRows] = await pool.query(
        `SELECT b.*, r.name AS room_name 
         FROM bookings b 
         LEFT JOIN rooms r ON b.room_id = r.id 
         WHERE b.id = ?`,
        [booking_id]
      );
      const bList = bRows as any[];
      if (bList.length > 0) {
        const b = bList[0];
        guestName = b.guest_name || "Guest";
        roomName = b.room_name || "Casa Nest Room";
        if (!bookingAmount || bookingAmount <= 0) {
          bookingAmount = Number(b.total_amount);
        }
      }

      // Mark booking as confirmed & paid
      await pool.query(
        `UPDATE bookings 
         SET payment_status = 'paid', 
             status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END 
         WHERE id = ?`,
        [booking_id]
      );

      // Check if payment row already exists for this booking
      const [existingPay] = await pool.query(
        "SELECT id FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1",
        [booking_id]
      );
      const payList = existingPay as any[];

      if (payList.length > 0) {
        await pool.query(
          `UPDATE payments 
           SET status = 'paid', 
               amount = ?, 
               payment_method = ?, 
               transaction_id = ?, 
               updated_at = NOW() 
           WHERE id = ?`,
          [bookingAmount, payMethod, razorpay_payment_id, payList[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO payments (booking_id, customer_name, amount, payment_method, transaction_id, status)
           VALUES (?, ?, ?, ?, ?, 'paid')`,
          [booking_id, guestName, bookingAmount, payMethod, razorpay_payment_id]
        );
      }

      // Record admin notification for instant visibility in admin dashboard
      await pool.query(
        `INSERT INTO notifications (type, title, message, link) 
         VALUES ('payment', ?, ?, ?)`,
        [
          `Razorpay Received: ₹${bookingAmount.toLocaleString("en-IN")}`,
          `Payment verified for Booking #${booking_id} (${guestName} • ${roomName}) via Razorpay. Txn ID: ${razorpay_payment_id}`,
          "/admin/payments",
        ]
      );
    } else {
      // Direct payment recording without prior booking
      await pool.query(
        `INSERT INTO payments (customer_name, amount, payment_method, transaction_id, status)
         VALUES (?, ?, ?, ?, 'paid')`,
        [guestName, bookingAmount, payMethod, razorpay_payment_id]
      );
    }

    res.json({
      success: true,
      stage: "confirmed",
      message: "Payment successfully verified and confirmed!",
      transaction_id: razorpay_payment_id,
      payment_status: "paid",
      booking_id,
      amount: bookingAmount,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed." });
  }
}


