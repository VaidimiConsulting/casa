import { Request, Response } from "express";
import pool from "../config/db.js";

// ==========================================
// CATEGORIES
// ==========================================

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const { activeOnly } = req.query;
    let sql = "SELECT * FROM restaurant_categories";
    if (activeOnly === "true") {
      sql += " WHERE is_active = 1";
    }
    sql += " ORDER BY display_order ASC, id ASC";

    const [rows] = await pool.query(sql);
    res.json({ success: true, categories: rows });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, slug, description, image, display_order, is_active } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, message: "Name and slug are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO restaurant_categories (name, slug, description, image, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, image || null, display_order || 0, is_active !== undefined ? is_active : 1]
    );

    res.status(201).json({
      success: true,
      message: "Category created.",
      categoryId: (result as { insertId: number }).insertId,
    });
  } catch (error: any) {
    console.error("Create category error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ success: false, message: "Category slug already exists." });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, slug, description, image, display_order, is_active } = req.body;

    await pool.query(
      `UPDATE restaurant_categories 
       SET name=?, slug=?, description=?, image=?, display_order=?, is_active=?
       WHERE id=?`,
      [name, slug, description || null, image || null, display_order || 0, is_active !== undefined ? is_active : 1, id]
    );

    res.json({ success: true, message: "Category updated." });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM restaurant_categories WHERE id = ?", [id]);
    res.json({ success: true, message: "Category deleted." });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// ==========================================
// MENU ITEMS
// ==========================================

export async function getMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { categoryId, isAvailable, search } = req.query;
    let sql = `
      SELECT m.*, c.name as category_name, c.slug as category_slug
      FROM menu_items m
      LEFT JOIN restaurant_categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoryId) {
      sql += " AND m.category_id = ?";
      params.push(categoryId);
    }
    if (isAvailable !== undefined && isAvailable !== "") {
      sql += " AND m.is_available = ?";
      params.push(isAvailable === "true" || isAvailable === "1" ? 1 : 0);
    }
    if (search) {
      sql += " AND (m.name LIKE ? OR m.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY m.category_id ASC, m.id ASC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, menuItems: rows });
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function createMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { category_id, name, description, price, image, is_veg, spicy_level, is_available } = req.body;

    if (!category_id || !name || price === undefined) {
      res.status(400).json({ success: false, message: "Category, name and price are required." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image, is_veg, spicy_level, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name,
        description || null,
        price,
        image || null,
        is_veg !== undefined ? (is_veg ? 1 : 0) : 1,
        spicy_level || "mild",
        is_available !== undefined ? (is_available ? 1 : 0) : 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu item created.",
      itemId: (result as { insertId: number }).insertId,
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image, is_veg, spicy_level, is_available } = req.body;

    await pool.query(
      `UPDATE menu_items 
       SET category_id=?, name=?, description=?, price=?, image=?, is_veg=?, spicy_level=?, is_available=?
       WHERE id=?`,
      [
        category_id,
        name,
        description || null,
        price,
        image || null,
        is_veg ? 1 : 0,
        spicy_level || "mild",
        is_available ? 1 : 0,
        id,
      ]
    );

    res.json({ success: true, message: "Menu item updated." });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function toggleMenuAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_available } = req.body;
    await pool.query("UPDATE menu_items SET is_available = ? WHERE id = ?", [is_available ? 1 : 0, id]);
    res.json({ success: true, message: "Availability updated." });
  } catch (error) {
    console.error("Toggle menu availability error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM menu_items WHERE id = ?", [id]);
    res.json({ success: true, message: "Menu item deleted." });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
