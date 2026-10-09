import pool from "../config/db.js";
// Initialize and ensure payments table schema is up to date
export async function initPaymentsTable() {
    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM payments LIKE 'customer_name'");
        if (cols.length === 0) {
            await pool.query("ALTER TABLE payments ADD COLUMN customer_name VARCHAR(100) DEFAULT NULL AFTER booking_id");
            console.log("✅ Added customer_name column to payments table.");
        }
        await pool.query("ALTER TABLE payments MODIFY COLUMN booking_id INT UNSIGNED DEFAULT NULL");
    }
    catch (error) {
        console.error("Init payments table error:", error);
    }
}
// GET /api/payments (admin)
export async function getPayments(req, res) {
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
        const params = [];
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
    }
    catch (error) {
        console.error("Get payments error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// POST /api/payments
export async function createPayment(req, res) {
    try {
        const { booking_id, customer_name, amount, payment_method, transaction_id, status } = req.body;
        if (!amount) {
            res.status(400).json({ success: false, message: "Amount is required." });
            return;
        }
        const txnId = transaction_id || `REC-${Date.now().toString().slice(-6)}`;
        const payStatus = status || "paid";
        const [result] = await pool.query(`INSERT INTO payments (booking_id, customer_name, amount, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            booking_id || null,
            customer_name || null,
            amount,
            payment_method || "Cash",
            txnId,
            payStatus,
        ]);
        const paymentId = result.insertId;
        if (booking_id && payStatus === "paid") {
            await pool.query("UPDATE bookings SET payment_status='paid', status=IF(status='cancelled', 'cancelled', 'confirmed') WHERE id=?", [booking_id]);
        }
        res.status(201).json({ success: true, message: "Payment recorded.", paymentId, transaction_id: txnId });
    }
    catch (error) {
        console.error("Create payment error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/payments/:id/status
export async function updatePaymentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (Number(id) > 0) {
            await pool.query("UPDATE payments SET status = ? WHERE id = ?", [status, id]);
            const [rows] = await pool.query("SELECT booking_id FROM payments WHERE id = ?", [id]);
            const payRows = rows;
            if (payRows.length > 0 && payRows[0].booking_id) {
                await pool.query("UPDATE bookings SET payment_status = ? WHERE id = ?", [
                    status === "paid" ? "paid" : "pending",
                    payRows[0].booking_id,
                ]);
            }
        }
        res.json({ success: true, message: "Payment status updated." });
    }
    catch (error) {
        console.error("Update payment status error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/payments/booking/:bookingId/status
export async function updateBookingPaymentStatus(req, res) {
    try {
        const { bookingId } = req.params;
        const { status, payment_method } = req.body;
        await pool.query("UPDATE bookings SET payment_status = ? WHERE id = ?", [
            status === "paid" ? "paid" : "pending",
            bookingId,
        ]);
        const [existing] = await pool.query("SELECT id FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1", [bookingId]);
        const existingRows = existing;
        if (existingRows.length > 0) {
            await pool.query("UPDATE payments SET status = ?, payment_method = COALESCE(?, payment_method) WHERE id = ?", [
                status,
                payment_method || null,
                existingRows[0].id,
            ]);
        }
        else {
            const [bRows] = await pool.query("SELECT guest_name, total_amount FROM bookings WHERE id = ?", [bookingId]);
            const bList = bRows;
            if (bList.length > 0) {
                await pool.query(`INSERT INTO payments (booking_id, customer_name, amount, payment_method, transaction_id, status)
           VALUES (?, ?, ?, ?, ?, ?)`, [
                    bookingId,
                    bList[0].guest_name,
                    bList[0].total_amount || 0,
                    payment_method || "Cash at Reception",
                    `REC-${Date.now().toString().slice(-6)}`,
                    status || "paid",
                ]);
            }
        }
        res.json({ success: true, message: "Payment status updated successfully." });
    }
    catch (error) {
        console.error("Update booking payment status error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/payments/:id
export async function getPaymentById(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT p.*, b.guest_name, b.guest_email
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       WHERE p.id = ?`, [id]);
        const payments = rows;
        if (payments.length === 0) {
            res.status(404).json({ success: false, message: "Payment not found." });
            return;
        }
        res.json({ success: true, payment: payments[0] });
    }
    catch (error) {
        console.error("Get payment error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// Removed Razorpay logic
