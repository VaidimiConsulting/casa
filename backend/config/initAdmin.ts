import bcrypt from "bcryptjs";
import pool from "./db.js";
import { initRoomsTable } from "../controllers/roomController.js";

export async function initAdminUser() {
  try {
    // Ensure all 5 rooms exist in DB as well
    await initRoomsTable();

    // Ensure users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(150)  NOT NULL UNIQUE,
        phone         VARCHAR(20)   DEFAULT NULL,
        password      VARCHAR(255)  NOT NULL,
        role          ENUM('user', 'admin', 'receptionist') NOT NULL DEFAULT 'user',
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Modify role column to ensure 'receptionist' is included
    try {
      await pool.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('user', 'admin', 'receptionist') NOT NULL DEFAULT 'user'
      `);
    } catch {
      // Ignore if already modified
    }

    // Hash admin password
    const adminPassword = await bcrypt.hash("admin123", 12);
    const [adminRows] = await pool.query("SELECT id FROM users WHERE email = 'admin@casanest.com'");
    if ((adminRows as any[]).length > 0) {
      await pool.query(
        "UPDATE users SET password = ?, role = 'admin', name = 'Casa Nest Admin' WHERE email = 'admin@casanest.com'",
        [adminPassword]
      );
      console.log("✅ Admin account updated with password 'admin123'");
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Casa Nest Admin', 'admin@casanest.com', ?, 'admin')",
        [adminPassword]
      );
      console.log("✅ Admin account created with email 'admin@casanest.com' & password 'admin123'");
    }

    // Hash receptionist password
    const receptionPassword = await bcrypt.hash("reception123", 12);
    const [recRows] = await pool.query("SELECT id FROM users WHERE email = 'reception@casanest.com'");
    if ((recRows as any[]).length > 0) {
      await pool.query(
        "UPDATE users SET password = ?, role = 'receptionist', name = 'Casa Nest Reception' WHERE email = 'reception@casanest.com'",
        [receptionPassword]
      );
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Casa Nest Reception', 'reception@casanest.com', ?, 'receptionist')",
        [receptionPassword]
      );
    }

    return { success: true, message: "Admin and Receptionist accounts initialized successfully." };
  } catch (error: any) {
    console.error("❌ initAdminUser error:", error);
    return { success: false, error: error.message };
  }
}
