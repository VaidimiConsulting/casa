import api from "./axios";

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  start_date: string;
  end_date: string;
  is_active: number;
  times_used: number;
  created_at?: string;
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const response = await api.get<{ success: boolean; coupons: Coupon[] }>("/coupons");
  return response.data.coupons;
}

export async function createCoupon(data: Partial<Coupon>) {
  const response = await api.post("/coupons", data);
  return response.data;
}

export async function updateCoupon(id: number, data: Partial<Coupon>) {
  const response = await api.put(`/coupons/${id}`, data);
  return response.data;
}

export async function toggleCouponStatus(id: number, is_active: boolean) {
  const response = await api.put(`/coupons/${id}/status`, { is_active });
  return response.data;
}

export async function deleteCoupon(id: number) {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
}
