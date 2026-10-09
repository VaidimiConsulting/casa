import pool from "../config/db.js";
import { calculateRoomOccupancy } from "./roomController.js";
// GET /api/admin/dashboard
export async function getDashboardStats(req, res) {
    try {
        const todayStr = new Date().toISOString().split("T")[0];
        // Fetch all rooms and active bookings for live occupancy
        const [allRoomRows] = await pool.query("SELECT id, name, room_type, price_per_night, capacity, status, image FROM rooms ORDER BY id ASC");
        const [bookingRows] = await pool.query(`SELECT id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, status, payment_status, total_amount
       FROM bookings
       WHERE status IN ('pending', 'confirmed')
         AND check_out >= CURDATE()
       ORDER BY check_in ASC`);
        const roomOccupancy = allRoomRows.map((r) => {
            const occ = calculateRoomOccupancy(r.id, bookingRows);
            return {
                id: r.id,
                name: r.name,
                room_type: r.room_type,
                price_per_night: Number(r.price_per_night),
                capacity: r.capacity,
                image: r.image,
                is_occupied: occ.is_occupied,
                occupancy_status: occ.occupancy_status,
                free_on_date: occ.free_on_date,
                free_on_time: occ.free_on_time,
                days_until_free: occ.days_until_free,
                summary_label: occ.summary_label,
                current_booking: occ.current_booking,
                next_booking: occ.next_booking,
            };
        });
        const totalRooms = roomOccupancy.length;
        const occupiedRooms = roomOccupancy.filter((r) => r.is_occupied).length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        // Bookings summary
        const [todayBookingsRows] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ?", [todayStr]);
        const todayBookings = Number(todayBookingsRows[0]?.count || 0);
        const [checkInRows] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE check_in = ? AND status IN ('pending', 'confirmed')", [todayStr]);
        const todayCheckIns = Number(checkInRows[0]?.count || 0);
        const [checkOutRows] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE check_out = ? AND status IN ('confirmed', 'completed')", [todayStr]);
        const todayCheckOuts = Number(checkOutRows[0]?.count || 0);
        // Today revenue (homestay room bookings)
        const [bookingRevRows] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE DATE(created_at) = ? AND payment_status = 'paid'", [todayStr]);
        const todayBookingRevenue = Number(bookingRevRows[0]?.total || 0);
        const todayRevenue = todayBookingRevenue;
        // Week revenue
        const [weekBookingRevRows] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND payment_status = 'paid'");
        const weekRevenue = Number(weekBookingRevRows[0]?.total || 0);
        // Month revenue
        const [monthBookingRevRows] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND payment_status = 'paid'");
        const monthRevenue = Number(monthBookingRevRows[0]?.total || 0);
        // Month customers (unique emails in the last 30 days)
        const [monthCustomersRows] = await pool.query("SELECT COUNT(DISTINCT guest_email) as total FROM bookings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
        const monthCustomers = Number(monthCustomersRows[0]?.total || 0);
        // Total revenue all time
        const [allBookingRevRows] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'paid'");
        const totalBookingRevenue = Number(allBookingRevRows[0]?.total || 0);
        const totalRevenue = totalBookingRevenue;
        // Pending requests (bookings + enquiries)
        const [pendingBookingsRows] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
        const [pendingMessagesRows] = await pool.query("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'unread'");
        const pendingRequests = Number(pendingBookingsRows[0]?.count || 0) +
            Number(pendingMessagesRows[0]?.count || 0);
        // Recent bookings
        const [recentBookings] = await pool.query(`
      SELECT b.*, r.name as room_name 
      FROM bookings b 
      LEFT JOIN rooms r ON b.room_id = r.id 
      ORDER BY b.created_at DESC 
      LIMIT 6
    `);
        // Booking status counts
        const [statusRows] = await pool.query("SELECT status, COUNT(*) as count FROM bookings GROUP BY status");
        const bookingStatusMap = {
            pending: 0,
            confirmed: 0,
            cancelled: 0,
            completed: 0,
        };
        statusRows.forEach((row) => {
            bookingStatusMap[row.status] = Number(row.count);
        });
        res.json({
            success: true,
            stats: {
                totalRooms,
                availableRooms,
                occupiedRooms,
                occupancyRate,
                todayBookings,
                todayCheckIns,
                todayCheckOuts,
                todayOrders: 0,
                todayRevenue,
                weekRevenue,
                monthRevenue,
                monthCustomers,
                todayBookingRevenue,
                todayOrderRevenue: 0,
                totalBookingRevenue,
                totalOrderRevenue: 0,
                totalRevenue,
                pendingRequests,
            },
            roomOccupancy,
            bookingStatusMap,
            recentBookings,
            recentOrders: [],
        });
    }
    catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/admin/reports
export async function getReports(req, res) {
    try {
        const { period = "month" } = req.query;
        let dateFilter = "created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        if (period === "today") {
            dateFilter = "DATE(created_at) = CURDATE()";
        }
        else if (period === "week") {
            dateFilter = "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        }
        else if (period === "year") {
            dateFilter = "created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
        }
        // Daily booking trends
        const [bookingTrends] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as total_bookings, COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      WHERE ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
        // Room popularity / occupancy
        const [roomPopularity] = await pool.query(`
      SELECT r.name, COUNT(b.id) as bookings_count, COALESCE(SUM(b.total_amount), 0) as revenue
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id
      GROUP BY r.id, r.name
      ORDER BY bookings_count DESC
    `);
        res.json({
            success: true,
            period,
            bookingTrends,
            orderTrends: [],
            roomPopularity,
            topMenuItems: [],
        });
    }
    catch (error) {
        console.error("Reports error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/admin/notifications
export async function getNotifications(_req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20");
        res.json({ success: true, notifications: rows });
    }
    catch (error) {
        console.error("Notifications error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
