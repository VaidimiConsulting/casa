import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}
// POST /api/auth/register
export async function register(req, res) {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            res.status(400).json({ success: false, message: "Please provide a valid name (at least 2 characters)." });
            return;
        }
        if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
            res.status(400).json({ success: false, message: "Please provide a valid email address." });
            return;
        }
        if (phone && typeof phone === "string" && phone.trim() && !PHONE_REGEX.test(phone.trim())) {
            res.status(400).json({ success: false, message: "Please enter a valid 10-15 digit phone number." });
            return;
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
            return;
        }
        // Check if email already exists
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            res.status(409).json({ success: false, message: "Email is already registered." });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        // Insert user
        const [result] = await pool.query("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'user')", [name.trim(), email.toLowerCase().trim(), phone?.trim() || null, hashedPassword]);
        const userId = result.insertId;
        const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role: "user" });
        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token,
            user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: "user" },
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// POST /api/auth/login
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required." });
            return;
        }
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        const users = rows;
        if (users.length === 0) {
            res.status(401).json({ success: false, message: "Invalid email or password." });
            return;
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: "Invalid email or password." });
            return;
        }
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        res.json({
            success: true,
            message: "Login successful.",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// GET /api/auth/profile  (protected)
export async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", [userId]);
        const users = rows;
        if (users.length === 0) {
            res.status(404).json({ success: false, message: "User not found." });
            return;
        }
        res.json({ success: true, user: users[0] });
    }
    catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
// PUT /api/auth/profile  (protected)
export async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { name, phone, currentPassword, newPassword } = req.body;
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            return;
        }
        if (phone && typeof phone === "string" && phone.trim() && !PHONE_REGEX.test(phone.trim())) {
            res.status(400).json({ success: false, message: "Please enter a valid 10-15 digit phone number." });
            return;
        }
        // If changing password, verify old password
        if (newPassword) {
            if (newPassword.length < 6) {
                res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
                return;
            }
            if (!currentPassword) {
                res.status(400).json({ success: false, message: "Current password is required to set a new password." });
                return;
            }
            const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);
            const user = rows[0];
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                res.status(401).json({ success: false, message: "Current password is incorrect." });
                return;
            }
            const hashed = await bcrypt.hash(newPassword, 12);
            await pool.query("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?", [name.trim(), phone?.trim() || null, hashed, userId]);
        }
        else {
            await pool.query("UPDATE users SET name = ?, phone = ? WHERE id = ?", [name.trim(), phone?.trim() || null, userId]);
        }
        const [updatedRows] = await pool.query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", [userId]);
        const updatedUser = updatedRows[0];
        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
}
