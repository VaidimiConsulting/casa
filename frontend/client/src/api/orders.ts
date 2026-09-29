import api from "./axios";

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  item_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface FoodOrder {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  room_number: string | null;
  total_amount: number;
  status: "new" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "failed";
  payment_method: string;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

export async function fetchOrders(params?: { status?: string; payment_status?: string; search?: string }): Promise<FoodOrder[]> {
  const response = await api.get<{ success: boolean; orders: FoodOrder[] }>("/orders", { params });
  return response.data.orders;
}

export async function fetchOrderById(id: number): Promise<FoodOrder> {
  const response = await api.get<{ success: boolean; order: FoodOrder }>(`/orders/${id}`);
  return response.data.order;
}

export async function updateOrderStatus(id: number, status: string) {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data;
}

export async function updateOrderPayment(id: number, payment_status: string) {
  const response = await api.put(`/orders/${id}/payment`, { payment_status });
  return response.data;
}

export async function deleteOrder(id: number) {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
}
