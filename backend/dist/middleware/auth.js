import jwt from "jsonwebtoken";
/**
 * Protect routes – require a valid JWT token in Authorization header
 */
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Access denied. No token provided." });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
}
/**
 * Require admin role – must be used AFTER authenticate middleware
 */
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        res.status(403).json({ success: false, message: "Access denied. Admin only." });
        return;
    }
    next();
}
/**
 * Require staff or admin role (receptionist or admin) – must be used AFTER authenticate middleware
 */
export function requireStaffOrAdmin(req, res, next) {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "receptionist")) {
        res.status(403).json({ success: false, message: "Access denied. Receptionist or Admin only." });
        return;
    }
    next();
}
