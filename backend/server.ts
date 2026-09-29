import "dotenv/config";
import express from "express";
import cors from "cors";
import { testConnection } from "./config/db.js";

// Import Routes
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import bookingRoutes from "./routes/bookings.js";
import contactRoutes from "./routes/contact.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import reviewRoutes from "./routes/reviews.js";
import couponRoutes from "./routes/coupons.js";
import staffRoutes from "./routes/staff.js";
import settingsRoutes from "./routes/settings.js";
import serviceRoutes from "./routes/services.js";
import uploadRoutes from "./routes/upload.js";
import galleryRoutes from "./routes/gallery.js";
import patioRoutes from "./routes/patio.js";
import libraryRoutes from "./routes/library.js";
import { initGalleryTable } from "./controllers/galleryController.js";
import { initPatioTable } from "./controllers/patioController.js";
import { initLibraryTables } from "./controllers/libraryController.js";
import { initRoomsTable } from "./controllers/roomController.js";
import { initPaymentsTable } from "./controllers/paymentController.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ============================================================
// Middleware
// ============================================================

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (e.g. room images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// Routes
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentRoutes);

// Homestay Management & In-room Services Routes
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/patio", patioRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);


// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Casa Nest Homestay & Restaurant API is running.",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

// ============================================================
// Global error handler
// ============================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ============================================================
// Start server
// ============================================================
async function startServer() {
  try {
    await testConnection();
    await initRoomsTable();
    await initPaymentsTable();
    await initGalleryTable();
    await initPatioTable();
    await initLibraryTables();

    app.listen(PORT, () => {
      console.log(`🏡 Casa Nest API running at http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🛏️  Rooms:        http://localhost:${PORT}/api/rooms`);
      console.log(`🍽️  Menu:         http://localhost:${PORT}/api/menu/items`);
      console.log(`📊 Admin:        http://localhost:${PORT}/api/admin/dashboard`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:", error);
    console.error("   Make sure MySQL is running and casa_nest database exists.");
    // Continue running server so API health endpoints still respond even if DB is reconnecting
    app.listen(PORT, () => {
      console.log(`⚠️ Casa Nest API running in offline/reconnect mode at http://localhost:${PORT}`);
    });
  }
}

startServer();
