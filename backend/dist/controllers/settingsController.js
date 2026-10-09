import pool from "../config/db.js";
// GET /api/settings
export async function getSettings(_req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM settings");
        const settingsMap = {};
        rows.forEach((row) => {
            settingsMap[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, settings: settingsMap, raw: rows });
    }
    catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/settings
export async function updateSettings(req, res) {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== "object") {
            res.status(400).json({ success: false, message: "Settings object required." });
            return;
        }
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(`INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`, [key, String(value), String(value)]);
        }
        res.json({ success: true, message: "Settings saved successfully." });
    }
    catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
