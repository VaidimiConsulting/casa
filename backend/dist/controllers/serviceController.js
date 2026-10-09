import pool from "../config/db.js";
// Ensure table exists
async function ensureRoomServicesTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS room_services (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        request_number VARCHAR(50) NOT NULL UNIQUE,
        room_number VARCHAR(50) NOT NULL,
        guest_name VARCHAR(100) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        notes TEXT DEFAULT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
        // Insert sample requests if empty
        const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM room_services");
        if (rows[0].cnt === 0) {
            await pool.query(`
        INSERT INTO room_services (request_number, room_number, guest_name, service_type, quantity, notes, status)
        VALUES 
        ('SR-1001', 'Room 101', 'Aarav Mehta', 'Chai & Coffee Sachets Refill', 4, 'Extra sugar and tea bags requested', 'completed'),
        ('SR-1002', 'Room 102', 'Sneha Roy', 'Electric Kettle Assistance', 1, 'Kettle setup with ceramic cups', 'in_progress'),
        ('SR-1003', 'Room 103', 'Vikram Joshi', 'Drinking Water & Coffee Sachets', 2, 'Two mineral water bottles and coffee sachets', 'pending')
      `);
        }
    }
    catch (err) {
        console.error("Room services table check error:", err);
    }
}
ensureRoomServicesTable();
// GET /api/services
export async function getServices(req, res) {
    try {
        const { status, search } = req.query;
        let sql = "SELECT * FROM room_services WHERE 1=1";
        const params = [];
        if (status && status !== "all") {
            sql += " AND status = ?";
            params.push(status);
        }
        if (search) {
            sql += " AND (request_number LIKE ? OR room_number LIKE ? OR guest_name LIKE ? OR service_type LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += " ORDER BY created_at DESC";
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, services: rows });
    }
    catch (error) {
        console.error("Get room services error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// POST /api/services
export async function createService(req, res) {
    try {
        const { room_number, guest_name, service_type, quantity, notes } = req.body;
        if (!room_number || !guest_name || !service_type) {
            res.status(400).json({ success: false, message: "Room number, guest name, and service type are required." });
            return;
        }
        const request_number = `SR-${Date.now().toString().slice(-4)}`;
        const [result] = await pool.query(`INSERT INTO room_services (request_number, room_number, guest_name, service_type, quantity, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`, [request_number, room_number, guest_name, service_type, quantity || 1, notes || null]);
        res.status(201).json({
            success: true,
            message: "Room service request registered.",
            serviceId: result.insertId,
            request_number,
        });
    }
    catch (error) {
        console.error("Create service error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/services/:id/status
export async function updateServiceStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query("UPDATE room_services SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true, message: "Service status updated." });
    }
    catch (error) {
        console.error("Update service status error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// DELETE /api/services/:id
export async function deleteService(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM room_services WHERE id = ?", [id]);
        res.json({ success: true, message: "Service request deleted." });
    }
    catch (error) {
        console.error("Delete service error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
