import bcrypt from "bcryptjs";
import pool from "./config/db.js";
async function createAccounts() {
    try {
        // Update users table ENUM to include 'receptionist'
        await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('user', 'admin', 'receptionist') NOT NULL DEFAULT 'user'
    `);
        console.log("✅ Role ENUM updated.");
        // Admin account
        const adminPassword = await bcrypt.hash("admin123", 12);
        const [adminRows] = await pool.query("SELECT id FROM users WHERE email = 'admin@casanest.com'");
        if (adminRows.length > 0) {
            await pool.query("UPDATE users SET password = ?, role = 'admin', name = 'Casa Nest Admin' WHERE email = 'admin@casanest.com'", [adminPassword]);
            console.log("✅ Admin account updated.");
        }
        else {
            await pool.query("INSERT INTO users (name, email, password, role) VALUES ('Casa Nest Admin', 'admin@casanest.com', ?, 'admin')", [adminPassword]);
            console.log("✅ Admin account created.");
        }
        // Receptionist account
        const receptionPassword = await bcrypt.hash("reception123", 12);
        const [recRows] = await pool.query("SELECT id FROM users WHERE email = 'reception@casanest.com'");
        if (recRows.length > 0) {
            await pool.query("UPDATE users SET password = ?, role = 'receptionist', name = 'Casa Nest Reception' WHERE email = 'reception@casanest.com'", [receptionPassword]);
            console.log("✅ Receptionist account updated.");
        }
        else {
            await pool.query("INSERT INTO users (name, email, password, role) VALUES ('Casa Nest Reception', 'reception@casanest.com', ?, 'receptionist')", [receptionPassword]);
            console.log("✅ Receptionist account created.");
        }
        console.log("\n========================================");
        console.log("🏨  ADMIN PANEL");
        console.log("    URL:      http://localhost:3000/admin/login");
        console.log("    Email:    admin@casanest.com");
        console.log("    Password: admin123");
        console.log("\n📋  RECEPTION PANEL");
        console.log("    URL:      http://localhost:3000/reception/login");
        console.log("    Email:    reception@casanest.com");
        console.log("    Password: reception123");
        console.log("========================================\n");
    }
    catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}
createAccounts();
