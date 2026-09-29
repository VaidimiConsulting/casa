import { Router } from "express";
import {
  getGallery,
  addGalleryItem,
  deleteGalleryItem,
  toggleGalleryStatus,
  updateGalleryItem,
  uploadGalleryImage,
  uploadGalleryMiddleware,
} from "../controllers/galleryController.js";
import { authenticate, requireStaffOrAdmin } from "../middleware/auth.js";

const router = Router();

// Public: GET active gallery items
router.get("/", getGallery);

// Admin / Staff only:
router.post(
  "/upload",
  authenticate,
  requireStaffOrAdmin,
  (req, res, next) => {
    uploadGalleryMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || "Upload error." });
      }
      next();
    });
  },
  uploadGalleryImage
);

router.post("/", authenticate, requireStaffOrAdmin, addGalleryItem);
router.put("/:id", authenticate, requireStaffOrAdmin, updateGalleryItem);
router.delete("/:id", authenticate, requireStaffOrAdmin, deleteGalleryItem);
router.put("/:id/status", authenticate, requireStaffOrAdmin, toggleGalleryStatus);

export default router;
