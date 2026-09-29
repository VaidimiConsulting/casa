import { Request, Response } from "express";
import pool from "../config/db.js";

// GET /api/orders
export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status, payment_status, search } = req.query;
    let sql = "SELECT * FROM food_orders WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }
    if (payment_status && payment_status !== "all") {
      sql += " AND payment_status = ?";
      params.push(payment_status);
    }
    if (search) {
      sql += " AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR room_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const [orderRows] = await pool.query(sql, params);
    const orders = orderRows as any[];

    // Fetch items for these orders if there are any
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const [itemRows] = await pool.query(
        `SELECT * FROM food_order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")})`,
        orderIds
      );
      const itemsByOrder: Record<number, any[]> = {};
      (itemRows as any[]).forEach((item) => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });

      orders.forEach((o) => {
        o.items = itemsByOrder[o.id] || [];
      });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// GET /api/orders/:id
export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [orders] = await pool.query("SELECT * FROM food_orders WHERE id = ?", [id]);
    const orderList = orders as any[];

    if (orderList.length === 0) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }

    const order = orderList[0];
    const [items] = await pool.query("SELECT * FROM food_order_items WHERE order_id = ?", [id]);
    order.items = items;

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// POST /api/orders
export async function createOrder(req: Request, res: Response): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      room_number,
      payment_method,
      notes,
      items,
    } = req.body;

    if (!customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Customer name, phone and at least one item required." });
      conn.release();
      return;
    }

    let total_amount = 0;
    items.forEach((item: any) => {
      total_amount += Number(item.price) * Number(item.quantity);
    });

    const order_number = `CN-ORD-${Date.now().toString().slice(-6)}`;

    const [result] = await conn.query(
      `INSERT INTO food_orders (order_number, user_id, customer_name, customer_email, customer_phone, room_number, total_amount, status, payment_status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'pending', ?, ?)`,
      [
        order_number,
        user_id || null,
        customer_name,
        customer_email || null,
        customer_phone,
        room_number || null,
        total_amount,
        payment_method || "Cash / Pay at Room",
        notes || null,
      ]
    );

    const orderId = (result as { insertId: number }).insertId;

    for (const item of items) {
      const subtotal = Number(item.price) * Number(item.quantity);
      await conn.query(
        `INSERT INTO food_order_items (order_id, menu_item_id, item_name, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.menu_item_id || null, item.item_name || item.name, item.quantity, item.price, subtotal]
      );
    }

    // Insert notification
    await conn.query(
      `INSERT INTO notifications (type, title, message, link)
       VALUES ('order', ?, ?, '/admin/orders')`,
      [`New Food Order: ${order_number}`, `${customer_name} ordered ${items.length} items (₹${total_amount})`]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({ success: true, message: "Order placed successfully.", orderId, order_number });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/orders/:id/status
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["new", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status." });
      return;
    }

    await pool.query("UPDATE food_orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: "Order status updated." });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// PUT /api/orders/:id/payment
export async function updateOrderPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    await pool.query("UPDATE food_orders SET payment_status = ? WHERE id = ?", [payment_status, id]);
    res.json({ success: true, message: "Order payment status updated." });
  } catch (error) {
    console.error("Update order payment error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// DELETE /api/orders/:id
export async function deleteOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM food_orders WHERE id = ?", [id]);
    res.json({ success: true, message: "Order deleted." });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
