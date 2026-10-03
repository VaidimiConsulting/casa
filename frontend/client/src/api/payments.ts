import api from "./axios";

export interface Payment {
  id: number;
  booking_id: number | null;
  customer_name: string | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  room_name?: string;
  amount: number;
  total_amount?: number;
  payment_method: string;
  transaction_id: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  booking_status?: string;
}

export async function fetchPayments(params?: { status?: string; search?: string }): Promise<Payment[]> {
  const response = await api.get<{ success: boolean; payments: Payment[] }>("/payments", { params });
  return response.data.payments;
}

export async function createPayment(data: Partial<Payment>) {
  const response = await api.post("/payments", data);
  return response.data;
}

export async function updatePaymentStatus(id: number, status: string) {
  const response = await api.put(`/payments/${id}/status`, { status });
  return response.data;
}

export async function updateBookingPaymentStatus(bookingId: number, status: string, paymentMethod?: string) {
  const response = await api.put(`/payments/booking/${bookingId}/status`, { status, payment_method: paymentMethod });
  return response.data;
}

// End of payments API
