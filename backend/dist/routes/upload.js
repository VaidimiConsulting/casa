import { Router } from "express";
import { uploadRoomImageMiddleware, uploadRoomImage } from "../controllers/uploadController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";
const router = Router();
// POST /api/upload/room-image (Staff or Admin only)
router.post("/room-image", authenticate, requireStaffOrAdmin, (req, res, next) => {
    uploadRoomImageMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || "Upload error." });
        }
        next();
    });
}, uploadRoomImage);
export default router;
