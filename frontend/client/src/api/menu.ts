import api from "./axios";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  display_order: number;
  is_active: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  is_veg: number;
  spicy_level: "mild" | "medium" | "spicy";
  is_available: number;
}

export async function fetchCategories(activeOnly = false): Promise<Category[]> {
  const response = await api.get<{ success: boolean; categories: Category[] }>("/menu/categories", {
    params: { activeOnly },
  });
  return response.data.categories;
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const response = await api.post("/menu/categories", data);
  return response.data;
}

export async function updateCategory(id: number, data: Partial<Category>) {
  const response = await api.put(`/menu/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: number) {
  const response = await api.delete(`/menu/categories/${id}`);
  return response.data;
}

export async function fetchMenuItems(params?: { categoryId?: number; isAvailable?: boolean; search?: string }): Promise<MenuItem[]> {
  const response = await api.get<{ success: boolean; menuItems: MenuItem[] }>("/menu/items", { params });
  return response.data.menuItems;
}

export async function createMenuItem(data: Partial<MenuItem>) {
  const response = await api.post("/menu/items", data);
  return response.data;
}

export async function updateMenuItem(id: number, data: Partial<MenuItem>) {
  const response = await api.put(`/menu/items/${id}`, data);
  return response.data;
}

export async function toggleMenuAvailability(id: number, is_available: boolean) {
  const response = await api.put(`/menu/items/${id}/availability`, { is_available });
  return response.data;
}

export async function deleteMenuItem(id: number) {
  const response = await api.delete(`/menu/items/${id}`);
  return response.data;
}
