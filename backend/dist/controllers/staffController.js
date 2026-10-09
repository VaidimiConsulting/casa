import pool from "../config/db.js";
// GET /api/staff
export async function getStaff(_req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM staff ORDER BY created_at DESC");
        res.json({ success: true, staff: rows });
    }
    catch (error) {
        console.error("Get staff error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// POST /api/staff
export async function createStaff(req, res) {
    try {
        const { name, email, phone, role, status } = req.body;
        if (!name || !email || !role) {
            res.status(400).json({ success: false, message: "Name, email and role are required." });
            return;
        }
        const [result] = await pool.query(`INSERT INTO staff (name, email, phone, role, status)
       VALUES (?, ?, ?, ?, ?)`, [name, email, phone || null, role || "receptionist", status || "active"]);
        res.status(201).json({
            success: true,
            message: "Staff member added.",
            staffId: result.insertId,
        });
    }
    catch (error) {
        console.error("Create staff error:", error);
        if (error.code === "ER_DUP_ENTRY") {
            res.status(400).json({ success: false, message: "Email already exists." });
            return;
        }
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/staff/:id
export async function updateStaff(req, res) {
    try {
        const { id } = req.params;
        const { name, email, phone, role, status } = req.body;
        await pool.query(`UPDATE staff 
       SET name=?, email=?, phone=?, role=?, status=?
       WHERE id=?`, [name, email, phone || null, role, status, id]);
        res.json({ success: true, message: "Staff member updated." });
    }
    catch (error) {
        console.error("Update staff error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/staff/:id/status
export async function toggleStaffStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query("UPDATE staff SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true, message: "Staff status updated." });
    }
    catch (error) {
        console.error("Toggle staff status error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// DELETE /api/staff/:id
export async function deleteStaff(req, res) {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM staff WHERE id = ?", [id]);
        res.json({ success: true, message: "Staff member deleted." });
    }
    catch (error) {
        console.error("Delete staff error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
