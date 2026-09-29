import { Request, Response } from "express";
import pool from "../config/db.js";

interface RoomRow {
  id: number;
  name: string;
  description: string | null;
  room_type: string | null;
  price_per_night: number;
  capacity: number;
  amenities: string | null;
  image: string | null;
  status: "available" | "unavailable";
  created_at: Date;
  updated_at: Date;
}

function parseRoom(row: RoomRow) {
  let amenitiesList: string[] = [];
  if (row.amenities) {
    if (typeof row.amenities === "string") {
      try {
        const parsed = JSON.parse(row.amenities);
        amenitiesList = Array.isArray(parsed) ? parsed : [row.amenities];
      } catch {
        amenitiesList = row.amenities.split(",").map((a) => a.trim()).filter(Boolean);
      }
    } else if (Array.isArray(row.amenities)) {
      amenitiesList = row.amenities;
    }
  }
  return {
    ...row,
    amenities: amenitiesList,
  };
}

// Fixed Room Rates (Non-editable homestay policy)
export const FIXED_ROOM_PRICES: Record<number, number> = {
  1: 3500, // Room 101 — Casa Luz
  6: 4000, // Room 102 — Casa Sereno
  4: 3800, // Room 104 — Casa Amore
  2: 3500, // Room 105 — Casa Sol
  3: 3200, // Casa Luna
};

// Ensure rooms table exists & seed 5 initial homestay rooms if empty
export async function initRoomsTable(): Promise<void> {
  try {
    // Ensure Casa Blanca is removed
    await pool.query("DELETE FROM rooms WHERE name LIKE '%Casa Blanca%' OR id = 5");

    // Ensure all 5 rooms have their exact fixed prices & room numbers in DB
    await pool.query("UPDATE rooms SET price_per_night = 3500, name = 'Room 101 — Casa Luz' WHERE id = 1 OR name LIKE '%Casa Luz%'");
    await pool.query("UPDATE rooms SET price_per_night = 4000, name = 'Room 102 — Casa Sereno' WHERE id = 6 OR name LIKE '%Casa Sereno%'");
    await pool.query("UPDATE rooms SET price_per_night = 3200, name = 'Room 103 — Casa Luna' WHERE id = 3 OR name LIKE '%Casa Luna%'");
    await pool.query("UPDATE rooms SET price_per_night = 3800, name = 'Room 104 — Casa Amore' WHERE id = 4 OR name LIKE '%Casa Amore%'");
    await pool.query("UPDATE rooms SET price_per_night = 3500, name = 'Room 105 — Casa Sol' WHERE id = 2 OR name LIKE '%Casa Sol%'");

    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM rooms");
    if (rows[0].count === 0) {
      const initialRooms = [
        {
          id: 1,
          name: "Room 101 — Casa Luz",
          room_type: "House of Light",
          price_per_night: 3500,
          capacity: 2,
          description: "House of Light – Crafted teak king bed, warm ambient spotlights & serene olive drapes.",
          image: "/images/rooms/casa_luz_master.jpg",
          amenities: JSON.stringify(["King Bed", "Wi-Fi", "AC", "Hot Water", "Artisan Decor"]),
          status: "available",
        },
        {
          id: 6,
          name: "Room 102 — Casa Sereno",
          room_type: "Calm & Peaceful",
          price_per_night: 4000,
          capacity: 2,
          description: "Calm and Peaceful – Stillness & serene comfort with handcrafted teak bed, artisanal ceramic donut vase & pampas accents.",
          image: "/images/rooms/casa_sereno_master.jpg",
          amenities: JSON.stringify(["King Bed", "Wi-Fi", "AC", "Hot Water", "Artisan Decor"]),
          status: "available",
        },
        {
          id: 3,
          name: "Room 103 — Casa Luna",
          room_type: "Moonlight Room",
          price_per_night: 3200,
          capacity: 3,
          description: "Moonlight Room – Calming sanctuary with rich wooden flooring, handcrafted teak bed, artisan donut vases & soothing sage accents.",
          image: "/images/rooms/casa_luna_master.jpg",
          amenities: JSON.stringify(["King Bed + Extra Bed", "Wi-Fi", "AC", "Hot Water", "Hardwood Floor"]),
          status: "available",
        },
        {
          id: 4,
          name: "Room 104 — Casa Amore",
          room_type: "Romantic & Cozy",
          price_per_night: 3800,
          capacity: 2,
          description: "Romantic and Cozy – Crafted for couples with folded elephant towel origami, plush teak king bed, custom wardrobe & warm ambient lighting.",
          image: "/images/rooms/casa_amore_master.jpg",
          amenities: JSON.stringify(["Plush King Bed", "Wi-Fi", "AC", "Hot Water", "Romantic Origami"]),
          status: "available",
        },
        {
          id: 2,
          name: "Room 105 — Casa Sol",
          room_type: "Sunshine Room",
          price_per_night: 3500,
          capacity: 2,
          description: "Sunshine Room – Bright morning sunlight, celebratory swan towel origami & warm tropical bohemian vibes.",
          image: "/images/rooms/casa_sol_master.jpg",
          amenities: JSON.stringify(["King Bed", "Wi-Fi", "AC", "Hot Water", "Swan Origami"]),
          status: "available",
        },
      ];

      for (const r of initialRooms) {
        await pool.query(
          `INSERT INTO rooms (id, name, room_type, price_per_night, capacity, description, image, amenities, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), image=VALUES(image), price_per_night=VALUES(price_per_night), description=VALUES(description)`,
          [r.id, r.name, r.room_type, r.price_per_night, r.capacity, r.description, r.image, r.amenities, r.status]
        );
      }
      console.log("🔒 Initial 5 homestay rooms seeded.");
    }
  } catch (error) {
    console.error("Failed to initialize room table:", error);
  }
}

function toYMD(d: any): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

export function calculateRoomOccupancy(roomId: number, bookings: any[]) {
  const todayYMD = new Date().toISOString().split("T")[0];
  const roomBookings = bookings.filter((b) => b.room_id === roomId);

  // Active stay today: check_in <= today AND check_out > today
  const currentStay = roomBookings.find(
    (b) => toYMD(b.check_in) <= todayYMD && toYMD(b.check_out) > todayYMD
  );

  if (currentStay) {
    const checkOutYMD = toYMD(currentStay.check_out);
    const checkInYMD = toYMD(currentStay.check_in);
    const daysUntilFree = Math.max(
      1,
      Math.ceil((new Date(checkOutYMD).getTime() - new Date(todayYMD).getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      is_occupied: true,
      occupancy_status: "occupied" as const,
      free_on_date: checkOutYMD,
      free_on_time: "11:00 AM",
      days_until_free: daysUntilFree,
      summary_label: `Occupied until ${checkOutYMD} (11:00 AM)`,
      current_booking: {
        id: currentStay.id,
        guest_name: currentStay.guest_name,
        guest_email: currentStay.guest_email,
        guest_phone: currentStay.guest_phone || null,
        check_in: checkInYMD,
        check_out: checkOutYMD,
        total_amount: Number(currentStay.total_amount || 0),
        payment_status: currentStay.payment_status,
      },
      next_booking: null,
    };
  }

  // Not occupied today: find next upcoming booking where check_in >= today
  const nextStay = roomBookings
    .filter((b) => toYMD(b.check_in) >= todayYMD)
    .sort((a, b) => toYMD(a.check_in).localeCompare(toYMD(b.check_in)))[0];

  let nextBookingInfo = null;
  let summary = "Vacant (Available Now)";

  if (nextStay) {
    const nextCheckInYMD = toYMD(nextStay.check_in);
    const nextCheckOutYMD = toYMD(nextStay.check_out);
    const daysUntilCheckIn = Math.max(
      0,
      Math.ceil((new Date(nextCheckInYMD).getTime() - new Date(todayYMD).getTime()) / (1000 * 60 * 60 * 24))
    );

    nextBookingInfo = {
      id: nextStay.id,
      guest_name: nextStay.guest_name,
      check_in: nextCheckInYMD,
      check_out: nextCheckOutYMD,
      days_until_checkin: daysUntilCheckIn,
    };

    summary = daysUntilCheckIn === 0
      ? `Vacant (Check-in starts today from 12:00 PM for ${nextStay.guest_name})`
      : `Vacant (Next booking on ${nextCheckInYMD}, free for ${daysUntilCheckIn} day${daysUntilCheckIn > 1 ? "s" : ""})`;
  }

  return {
    is_occupied: false,
    occupancy_status: "vacant" as const,
    free_on_date: null,
    free_on_time: "Available Now",
    days_until_free: 0,
    summary_label: summary,
    current_booking: null,
    next_booking: nextBookingInfo,
  };
}

// GET /api/rooms
export async function getRooms(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    let sql = "SELECT * FROM rooms";
    const params: string[] = [];

    if (status === "available" || status === "unavailable") {
      sql += " WHERE status = ?";
      params.push(status);
    }

    sql += ` ORDER BY 
      CASE 
        WHEN name LIKE '%101%' THEN 101
        WHEN name LIKE '%102%' THEN 102
        WHEN name LIKE '%103%' THEN 103
        WHEN name LIKE '%104%' THEN 104
        WHEN name LIKE '%105%' THEN 105
        ELSE id + 900
      END ASC`;

    const [rows] = await pool.query(sql, params);

    // Fetch active & upcoming bookings to attach real-time occupancy
    const [bookingRows] = await pool.query(
      `SELECT id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, status, payment_status, total_amount
       FROM bookings
       WHERE status IN ('pending', 'confirmed')
         AND check_out >= CURDATE()
       ORDER BY check_in ASC`
    );

    const rooms = (rows as RoomRow[]).map((r) => {
      const parsed = parseRoom(r);
      const occupancy = calculateRoomOccupancy(r.id, bookingRows as any[]);
      return {
        ...parsed,
        occupancy,
      };
    });

    // Ensure rooms are sorted in ascending serial room number order (101, 102, 103, 104, 105)
    rooms.sort((a, b) => {
      const numA = parseInt((a.name.match(/\d+/) || ["999"])[0], 10);
      const numB = parseInt((b.name.match(/\d+/) || ["999"])[0], 10);
      return numA - numB;
    });

    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/rooms/:id
export async function getRoomById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [id]);
    const rooms = rows as RoomRow[];

    if (rooms.length === 0) {
      res.status(404).json({ success: false, message: "Room not found." });
      return;
    }

    const [bookingRows] = await pool.query(
      `SELECT id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, status, payment_status, total_amount
       FROM bookings
       WHERE room_id = ?
         AND status IN ('pending', 'confirmed')
         AND check_out >= CURDATE()
       ORDER BY check_in ASC`,
      [id]
    );

    const parsed = parseRoom(rooms[0]);
    const occupancy = calculateRoomOccupancy(Number(id), bookingRows as any[]);

    res.json({ success: true, room: { ...parsed, occupancy } });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/rooms  (admin only)
export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, room_type, price_per_night, capacity, amenities, image, status } = req.body;

    if (!name || !price_per_night) {
      res.status(400).json({ success: false, message: "Name and price_per_night are required." });
      return;
    }

    const amenitiesJson = amenities ? JSON.stringify(amenities) : null;

    const [result] = await pool.query(
      `INSERT INTO rooms (name, description, room_type, price_per_night, capacity, amenities, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        room_type || null,
        price_per_night,
        capacity || 2,
        amenitiesJson,
        image || null,
        status || "available",
      ]
    );

    const roomId = (result as { insertId: number }).insertId;
    res.status(201).json({ success: true, message: "Room created.", roomId });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/rooms/:id  (admin only)
export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, room_type, price_per_night, capacity, amenities, image, status } = req.body;

    // Check if room exists
    const [existingRows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [id]);
    const existing = (existingRows as RoomRow[])[0];
    if (!existing) {
      res.status(404).json({ success: false, message: "Room not found." });
      return;
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedDescription = description !== undefined ? description : existing.description;
    const updatedRoomType = room_type !== undefined ? room_type : existing.room_type;
    // Room price is fixed by policy and cannot be altered
    const updatedPrice = FIXED_ROOM_PRICES[Number(id)] || existing.price_per_night;
    const updatedCapacity = capacity !== undefined ? Number(capacity) : existing.capacity;
    const updatedAmenities = amenities !== undefined 
      ? (Array.isArray(amenities) ? JSON.stringify(amenities) : amenities)
      : existing.amenities;
    const updatedImage = image !== undefined ? image : existing.image;
    const updatedStatus = status !== undefined ? status : existing.status;

    if (updatedPrice < 0) {
      res.status(400).json({ success: false, message: "Price per night cannot be negative." });
      return;
    }

    await pool.query(
      `UPDATE rooms SET name=?, description=?, room_type=?, price_per_night=?, capacity=?,
       amenities=?, image=?, status=? WHERE id=?`,
      [
        updatedName,
        updatedDescription,
        updatedRoomType,
        updatedPrice,
        updatedCapacity,
        updatedAmenities,
        updatedImage,
        updatedStatus,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Room updated successfully.",
      room: {
        id: Number(id),
        name: updatedName,
        price_per_night: updatedPrice,
        status: updatedStatus,
      },
    });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/rooms/bulk-price-adjust (admin only)
export async function bulkPriceAdjust(req: Request, res: Response): Promise<void> {
  try {
    const { roomIds, adjustmentType, action, amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: "Please provide a valid adjustment amount." });
      return;
    }

    const val = Number(amount);
    let targetRoomsCondition = "";
    const params: any[] = [];

    if (Array.isArray(roomIds) && roomIds.length > 0) {
      targetRoomsCondition = `WHERE id IN (${roomIds.map(() => "?").join(",")})`;
      params.push(...roomIds);
    }

    let updateSql = "";
    if (adjustmentType === "percent") {
      const multiplier = action === "increase" ? (1 + val / 100) : Math.max(0.1, 1 - val / 100);
      updateSql = `UPDATE rooms SET price_per_night = ROUND(price_per_night * ${multiplier}, -1) ${targetRoomsCondition}`;
    } else {
      // Fixed amount
      if (action === "increase") {
        updateSql = `UPDATE rooms SET price_per_night = price_per_night + ${val} ${targetRoomsCondition}`;
      } else {
        updateSql = `UPDATE rooms SET price_per_night = GREATEST(500, price_per_night - ${val}) ${targetRoomsCondition}`;
      }
    }

    const [result] = await pool.query(updateSql, params);
    const affected = (result as { affectedRows: number }).affectedRows;

    res.json({
      success: true,
      message: `Successfully adjusted prices for ${affected} room(s).`,
      affectedRows: affected,
    });
  } catch (error) {
    console.error("Bulk price adjust error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/rooms/:id  (admin only)
export async function deleteRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM rooms WHERE id = ?", [id]);
    res.json({ success: true, message: "Room deleted." });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
