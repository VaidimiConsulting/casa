import { Request, Response } from "express";
import pool from "../config/db.js";

// GET /api/settings
export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query("SELECT * FROM settings");
    const settingsMap: Record<string, string> = {};
    (rows as { setting_key: string; setting_value: string }[]).forEach((row) => {
      settingsMap[row.setting_key] = row.setting_value;
    });

    res.json({ success: true, settings: settingsMap, raw: rows });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/settings
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      res.status(400).json({ success: false, message: "Settings object required." });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, String(value), String(value)]
      );
    }

    res.json({ success: true, message: "Settings saved successfully." });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
