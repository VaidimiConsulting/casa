import pool from "../config/db.js";
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
export async function createBooking(req, res) {
    try {
        const { room_id, // can be single id or array of ids
        guest_name, guest_email, guest_phone, check_in, check_out, males = 0, females = 0, children = 0, guests, notes, coupon_code, } = req.body;
        const parsedMales = parseInt(males) || 0;
        const parsedFemales = parseInt(females) || 0;
        const parsedChildren = parseInt(children) || 0;
        const parsedGuests = guests ? parseInt(guests) : (parsedMales + parsedFemales + parsedChildren);
        // 1. Validate Guest Name
        if (!guest_name || typeof guest_name !== "string" || guest_name.trim().length < 2) {
            res.status(400).json({ success: false, message: "Please enter a valid guest name." });
            return;
        }
        // 2. Validate Email & Phone
        if (!guest_email || !EMAIL_REGEX.test(guest_email.trim())) {
            res.status(400).json({ success: false, message: "Please enter a valid email." });
            return;
        }
        if (guest_phone && !PHONE_REGEX.test(guest_phone.trim())) {
            res.status(400).json({ success: false, message: "Please enter a valid phone number." });
            return;
        }
        // 3. Validate Dates
        if (!check_in || !check_out || !DATE_REGEX.test(check_in) || !DATE_REGEX.test(check_out)) {
            res.status(400).json({ success: false, message: "Valid check-in and check-out dates are required." });
            return;
        }
        const checkInDate = new Date(`${check_in}T00:00:00`);
        const checkOutDate = new Date(`${check_out}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkInDate < today) {
            res.status(400).json({ success: false, message: "Check-in date cannot be in the past." });
            return;
        }
        if (checkOutDate <= checkInDate) {
            res.status(400).json({ success: false, message: "Check-out must be after check-in." });
            return;
        }
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        // 4. Validate Guest Counts
        if (parsedGuests < 1) {
            res.status(400).json({ success: false, message: "At least 1 guest is required." });
            return;
        }
        if (parsedChildren > 2) {
            res.status(400).json({ success: false, message: "Maximum 2 children (0-15 years) are allowed per booking." });
            return;
        }
        // 5. Handle Multiple Rooms
        let roomIds = [];
        if (Array.isArray(room_id)) {
            roomIds = room_id;
        }
        else if (room_id) {
            roomIds = [room_id];
        }
        if (roomIds.length === 0) {
            res.status(400).json({ success: false, message: "Please select at least one room." });
            return;
        }
        // Fetch room details
        const [roomRows] = await pool.query("SELECT id, name, price_per_night, capacity, status FROM rooms WHERE id IN (?)", [roomIds]);
        const roomsList = roomRows;
        if (roomsList.length !== roomIds.length) {
            res.status(404).json({ success: false, message: "One or more selected rooms were not found." });
            return;
        }
        // Validate capacities and status
        let total_capacity = 0;
        for (const room of roomsList) {
            if (room.status === "unavailable") {
                res.status(400).json({ success: false, message: `Room ${room.name} is currently unavailable.` });
                return;
            }
            total_capacity += room.capacity;
        }
        // Check if total guests exceed total capacity of selected rooms (excluding children under 15 if needed, but let's strictly enforce)
        // Actually the requirement is strict limits per room, so we check total guests <= total capacity
        if (parsedMales + parsedFemales > total_capacity) {
            res.status(400).json({ success: false, message: `Total adults (${parsedMales + parsedFemales}) exceed the total capacity (${total_capacity}) of the selected rooms.` });
            return;
        }
        // Check for overlapping bookings
        const [conflicts] = await pool.query(`SELECT id, room_id FROM bookings 
       WHERE room_id IN (?) 
         AND (status = 'confirmed' OR payment_status = 'paid') 
         AND NOT (check_out <= ? OR check_in >= ?)`, [roomIds, check_in, check_out]);
        if (conflicts.length > 0) {
            res.status(409).json({ success: false, message: "One or more selected rooms are already booked for these dates." });
            return;
        }
        const user_id = req.user?.id || null;
        const groupId = `GRP-${Date.now()}`;
        let grandTotal = 0;
        let firstBookingId = null;
        // Calculate total order amount for coupon validation
        let orderAmount = 0;
        for (const room of roomsList) {
            orderAmount += Number(room.price_per_night) * nights;
        }
        let totalDiscount = 0;
        let couponNote = "";
        if (coupon_code) {
            const [rows] = await pool.query("SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= CURDATE() AND end_date >= CURDATE()", [coupon_code.toUpperCase()]);
            const coupons = rows;
            if (coupons.length > 0) {
                const coupon = coupons[0];
                if (orderAmount >= Number(coupon.min_order_amount)) {
                    if (coupon.discount_type === "percentage") {
                        totalDiscount = (orderAmount * Number(coupon.discount_value)) / 100;
                        if (coupon.max_discount && totalDiscount > Number(coupon.max_discount)) {
                            totalDiscount = Number(coupon.max_discount);
                        }
                    }
                    else {
                        totalDiscount = Number(coupon.discount_value);
                    }
                    // Increment times_used
                    await pool.query("UPDATE coupons SET times_used = times_used + 1 WHERE id = ?", [coupon.id]);
                    couponNote = `\n[Coupon Applied: ${coupon.code} - ₹${totalDiscount.toFixed(2)} OFF]`;
                }
            }
        }
        let remainingDiscount = totalDiscount;
        // Create bookings for each room
        for (let i = 0; i < roomsList.length; i++) {
            const room = roomsList[i];
            let roomTotal = Number(room.price_per_night) * nights;
            let roomDiscount = 0;
            if (i === roomsList.length - 1) {
                roomDiscount = remainingDiscount;
            }
            else {
                roomDiscount = Math.round((roomTotal / orderAmount) * totalDiscount);
                remainingDiscount -= roomDiscount;
            }
            const finalRoomTotal = Math.max(0, roomTotal - roomDiscount);
            grandTotal += finalRoomTotal;
            const finalNotes = ((notes?.trim() || "") + couponNote).trim();
            const [result] = await pool.query(`INSERT INTO bookings (user_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, males, females, children, group_id, total_amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                user_id,
                room.id,
                guest_name.trim(),
                guest_email.toLowerCase().trim(),
                guest_phone?.trim() || null,
                check_in,
                check_out,
                parsedGuests,
                parsedMales,
                parsedFemales,
                parsedChildren,
                groupId,
                finalRoomTotal,
                finalNotes || null,
            ]);
            const bId = result.insertId;
            if (!firstBookingId)
                firstBookingId = bId;
        }
        // Create notification
        await pool.query(`INSERT INTO notifications (type, title, message, link) VALUES ('booking', ?, ?, ?)`, [
            `New Reservation: ${guest_name.trim()}`,
            `Booking for ${roomIds.length} room(s) received (${check_in} to ${check_out})`,
            "/admin/bookings",
        ]);
        res.status(201).json({
            success: true,
            message: "Booking submitted successfully!",
            bookingId: firstBookingId,
            total_amount: grandTotal,
            group_id: groupId
        });
    }
    catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/bookings  (admin gets all, user gets own)
export async function getBookings(req, res) {
    try {
        let sql;
        let params;
        if (req.user?.role === "admin" || req.user?.role === "receptionist") {
            sql = `SELECT ${BOOKING_SELECT_FIELDS}
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             ORDER BY b.created_at DESC`;
            params = [];
        }
        else {
            sql = `SELECT ${BOOKING_SELECT_FIELDS}
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`;
            params = [req.user.id];
        }
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, bookings: rows });
    }
    catch (error) {
        console.error("Get bookings error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/bookings/:id  (protected)
export async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT ${BOOKING_SELECT_FIELDS}
       FROM bookings b
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ?`, [id]);
        const bookings = rows;
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
    }
    catch (error) {
        console.error("Get booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/bookings/:id  (admin / staff)
export async function updateBooking(req, res) {
    try {
        const { id } = req.params;
        const { status, payment_status, payment_method, transaction_id } = req.body;
        await pool.query("UPDATE bookings SET status=COALESCE(?, status), payment_status=COALESCE(?, payment_status) WHERE id=?", [status, payment_status, id]);
        // If payment details provided or payment_status is 'paid'
        if (payment_status === "paid" || payment_method || transaction_id) {
            const [existingPay] = await pool.query("SELECT id FROM payments WHERE booking_id = ?", [id]);
            const payList = existingPay;
            if (payList.length > 0) {
                await pool.query("UPDATE payments SET status=COALESCE(?, status), payment_method=COALESCE(?, payment_method), transaction_id=COALESCE(?, transaction_id) WHERE booking_id=?", [payment_status || "paid", payment_method || null, transaction_id || null, id]);
            }
            else {
                const [bRows] = await pool.query("SELECT total_amount FROM bookings WHERE id = ?", [id]);
                const b = bRows[0];
                if (b) {
                    await pool.query("INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)", [
                        id,
                        b.total_amount,
                        payment_method || "UPI",
                        transaction_id || `REC-${Date.now().toString().slice(-6)}`,
                        payment_status || "paid",
                    ]);
                }
            }
        }
        res.json({ success: true, message: "Booking and payment status updated." });
    }
    catch (error) {
        console.error("Update booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// DELETE /api/bookings/:id  (admin only)
export async function deleteBooking(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
        res.json({ success: true, message: "Booking deleted." });
    }
    catch (error) {
        console.error("Delete booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// POST /api/bookings/:id/pay (customer or staff/admin pays for booking)
export async function payForBooking(req, res) {
    try {
        const { id } = req.params;
        const { payment_method, transaction_id, payment_amount } = req.body;
        const [bRows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
        const booking = bRows[0];
        if (!booking) {
            res.status(404).json({ success: false, message: "Booking not found." });
            return;
        }
        // Ensure only owner or staff/admin can pay
        if (req.user?.role !== "admin" &&
            req.user?.role !== "receptionist" &&
            booking.user_id !== req.user?.id) {
            res.status(403).json({ success: false, message: "Access denied." });
            return;
        }
        const finalMethod = payment_method || "UPI (Online)";
        const finalTxn = transaction_id || `CN-PAY-${Date.now().toString().slice(-7)}`;
        const finalAmount = payment_amount || booking.total_amount;
        await pool.query("UPDATE bookings SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?", [id]);
        // Upsert payment
        const [existingPay] = await pool.query("SELECT id FROM payments WHERE booking_id = ?", [id]);
        if (existingPay.length > 0) {
            await pool.query("UPDATE payments SET status = 'paid', amount = ?, payment_method = ?, transaction_id = ?, updated_at = NOW() WHERE booking_id = ?", [finalAmount, finalMethod, finalTxn, id]);
        }
        else {
            await pool.query("INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, 'paid')", [id, finalAmount, finalMethod, finalTxn]);
        }
        // Insert notification
        await pool.query("INSERT INTO notifications (type, title, message, link) VALUES ('booking', ?, ?, ?)", [
            `Payment Received: ₹${Number(finalAmount).toLocaleString()}`,
            `Payment confirmed for Booking #${id} (${booking.guest_name}) via ${finalMethod}`,
            "/admin/bookings",
        ]);
        res.json({
            success: true,
            message: "Payment processed successfully.",
            transaction_id: finalTxn,
            payment_method: finalMethod,
        });
    }
    catch (error) {
        console.error("Pay booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/bookings/room/:roomId/booked-dates (public availability)
export async function getRoomBookedDates(req, res) {
    try {
        const { roomId } = req.params;
        const [rows] = await pool.query(`SELECT check_in, check_out, status 
       FROM bookings 
       WHERE room_id = ? 
         AND (status = 'confirmed' OR payment_status = 'paid')
         AND check_out >= CURDATE()
       ORDER BY check_in ASC`, [roomId]);
        res.json({ success: true, bookedDates: rows });
    }
    catch (error) {
        console.error("Get booked dates error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/bookings/:id/cancel (customer can cancel their own booking)
export async function cancelMyBooking(req, res) {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        if (!user_id) {
            res.status(401).json({ success: false, message: "Unauthorized." });
            return;
        }
        const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [id, user_id]);
        const bookings = rows;
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
    }
    catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
