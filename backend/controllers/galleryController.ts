import { Request, Response } from "express";
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/gallery directory exists
const galleryUploadDir = path.join(__dirname, "..", "uploads", "gallery");
if (!fs.existsSync(galleryUploadDir)) {
  fs.mkdirSync(galleryUploadDir, { recursive: true });
}

// Multer storage for gallery images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, galleryUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, WEBP, AVIF) are allowed."));
  }
};

export const uploadGalleryMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter,
}).single("image");

// Ensure gallery table exists & seed Casa Nest Hotel & Homestay photos
export async function initGalleryTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        image_url TEXT NOT NULL,
        alt_text VARCHAR(255) DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clean up any old Kashi tourist items that were seeded into the hotel gallery
    await pool.query(`
      DELETE FROM gallery 
      WHERE image_url LIKE '%/varanasi/%' 
         OR category IN ('Culture & Spiritual', 'Ghats & River', 'Food & Moments')
    `);

    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM gallery");
    if (rows[0].count === 0) {
      const initialHotelGallery = [
        {
          title: "Casa Luz Master Suite & Study Lounge",
          category: "Rooms & Suites",
          image_url: "/images/gallery/casa_luz_master.jpg",
          alt_text: "Spacious King bedroom with custom wooden wardrobe, study desk, designer ceiling & olive aesthetics",
        },
        {
          title: "Casa Nest Fairy-Lit Rooftop Bamboo Gazebo & Patio",
          category: "Terrace & Patio",
          image_url: "/images/patio_terrace.jpg",
          alt_text: "Rooftop bamboo gazebo dining patio with warm ambient lighting, green wooden dining table and comfortable lounge seating",
        },
        {
          title: "Casa Luz Teakwood Bed & Handwoven Runner",
          category: "Rooms & Suites",
          image_url: "/images/gallery/casa_luz_bed_view.jpg",
          alt_text: "Solid wood king bed frame, fresh white linens, plush pillows and geometric floor rug",
        },
        {
          title: "Casa Luz Boho Wall Art, Lloyd AC & Ambient Light",
          category: "Rooms & Suites",
          image_url: "/images/gallery/casa_luz_headboard.jpg",
          alt_text: "Warm ambient wall with modern botanical line-art frames and whisper-quiet cooling",
        },
        {
          title: "Casa Luz Bedside Pampas Grass & Olive Drapes",
          category: "Lounge & Ambiance",
          image_url: "/images/gallery/casa_luz_nightstand.jpg",
          alt_text: "Ceramic donut vase with natural dried grass accents beside olive green silk drapery",
        },
        {
          title: "Casa Luz Stepped False Ceiling with Spotlights",
          category: "Lounge & Ambiance",
          image_url: "/images/gallery/casa_luz_ceiling.jpg",
          alt_text: "Stepped architectural false ceiling with warm ambient recessed spotlights",
        },
        {
          title: "Casa Luz Silk Olive Cushions & Cloud Pillows",
          category: "Rooms & Suites",
          image_url: "/images/gallery/casa_luz_cushions.jpg",
          alt_text: "Layered comfort with soft sleeping pillows and geometric textured olive green cushions",
        },
        {
          title: "Casa Luz Minimalist Ceramic & Dried Botanicals",
          category: "Lounge & Ambiance",
          image_url: "/images/gallery/casa_luz_decor.jpg",
          alt_text: "Handcrafted wooden nightstand with minimalist white ceramic vase and dried bunny tails",
        },
        {
          title: "Casa Luz Suite - Full Room Perspective",
          category: "Rooms & Suites",
          image_url: "/images/gallery/casa_luz_suite.jpg",
          alt_text: "Full perspective of spacious air-conditioned suite with wardrobe, polished floors and calm vibe",
        },
        {
          title: "Sunlit Casa Nest Main Lounge",
          category: "Lounge & Ambiance",
          image_url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=88",
          alt_text: "Sunlit living lounge with indoor plants and warm homestay atmosphere",
        },
        {
          title: "Artisanal Homestay Dining Space",
          category: "Dining & Cafe",
          image_url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1100&q=88",
          alt_text: "Fresh morning breakfast and artisan dining table setup",
        },
        {
          title: "Fairy-Lit Evening Patio Seating",
          category: "Terrace & Patio",
          image_url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1100&q=88",
          alt_text: "Warm evening lighting and comfortable seating on the rooftop terrace",
        },
      ];

      for (const g of initialHotelGallery) {
        await pool.query(
          `INSERT INTO gallery (title, category, image_url, alt_text, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [g.title, g.category, g.image_url, g.alt_text]
        );
      }
      console.log("📸 Seeded Casa Nest hotel & homestay photos into gallery table.");
    }
  } catch (error) {
    console.error("Failed to initialize gallery table:", error);
  }
}


// Upload endpoint: POST /api/gallery/upload
export async function uploadGalleryImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No image file provided." });
      return;
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol === "https" ? "https" : "http";
    const fileUrl = `${protocol}://${host}/uploads/gallery/${req.file.filename}`;

    res.json({
      success: true,
      message: "Image uploaded successfully.",
      filename: req.file.filename,
      url: fileUrl,
    });
  } catch (error) {
    console.error("Gallery upload error:", error);
    res.status(500).json({ success: false, message: "Failed to upload image." });
  }
}

// GET /api/gallery
export async function getGallery(req: Request, res: Response): Promise<void> {
  try {
    const { all } = req.query;
    let sql = "SELECT * FROM gallery";
    if (!all || all === "false") {
      sql += " WHERE is_active = 1";
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql);
    res.json({ success: true, gallery: rows });
  } catch (error) {
    console.error("Get gallery error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/gallery
export async function addGalleryItem(req: Request, res: Response): Promise<void> {
  try {
    const { title, category, image_url, alt_text } = req.body;

    if (!image_url || !title) {
      res.status(400).json({ success: false, message: "Title and Image are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO gallery (title, category, image_url, alt_text, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [title.trim(), category?.trim() || "General", image_url.trim(), alt_text?.trim() || title.trim()]
    );

    const insertId = (result as { insertId: number }).insertId;
    res.status(201).json({
      success: true,
      message: "Image added to gallery.",
      id: insertId,
    });
  } catch (error) {
    console.error("Add gallery item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/gallery/:id
export async function deleteGalleryItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM gallery WHERE id = ?", [id]);
    res.json({ success: true, message: "Gallery image deleted." });
  } catch (error) {
    console.error("Delete gallery item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/gallery/:id/status
export async function toggleGalleryStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query("UPDATE gallery SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, id]);
    res.json({ success: true, message: "Gallery status updated." });
  } catch (error) {
    console.error("Toggle gallery status error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/gallery/:id (Full Update)
export async function updateGalleryItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, category, image_url, alt_text, is_active } = req.body;

    if (!title || !image_url) {
      res.status(400).json({ success: false, message: "Title and Image are required." });
      return;
    }

    const [existing] = await pool.query("SELECT * FROM gallery WHERE id = ?", [id]);
    if ((existing as any[]).length === 0) {
      res.status(404).json({ success: false, message: "Gallery item not found." });
      return;
    }

    await pool.query(
      `UPDATE gallery 
       SET title = ?, category = ?, image_url = ?, alt_text = ?, is_active = ?
       WHERE id = ?`,
      [
        title.trim(),
        category?.trim() || "General",
        image_url.trim(),
        alt_text?.trim() || title.trim(),
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id,
      ]
    );

    res.json({ success: true, message: "Gallery photo details updated successfully." });
  } catch (error) {
    console.error("Update gallery item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

