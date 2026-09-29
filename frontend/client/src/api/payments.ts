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

export interface RazorpayValidateResponse {
  success: boolean;
  valid: boolean;
  stage?: string;
  booking_id?: number | null;
  payable_amount: number;
  amount_paise: number;
  currency: string;
  room_name?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  gateway_ready: boolean;
  is_configured: boolean;
  already_paid?: boolean;
  message?: string;
}

export interface RazorpayConfigResponse {
  success: boolean;
  key_id: string;
  is_configured: boolean;
  currency: string;
  company_name: string;
  description: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  stage?: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  key_id: string;
  booking_id?: number;
  room_name?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  is_mock?: boolean;
  message?: string;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  booking_id: number;
  amount: number;
  payment_method?: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  stage?: string;
  message: string;
  transaction_id: string;
  payment_status: string;
  booking_id?: number;
  amount?: number;
}

export async function getRazorpayConfig(): Promise<RazorpayConfigResponse> {
  const response = await api.get<RazorpayConfigResponse>("/payments/razorpay/config");
  return response.data;
}

// 1. Step 1: Validate Payment Request
export async function validatePayment(bookingId: number, amount?: number): Promise<RazorpayValidateResponse> {
  const response = await api.post<RazorpayValidateResponse>("/payments/razorpay/validate", {
    booking_id: bookingId,
    amount,
  });
  return response.data;
}

// 2. Step 2: Initiate Razorpay Gateway Order
export async function initiatePayment(bookingId: number, amount?: number): Promise<RazorpayOrderResponse> {
  const response = await api.post<RazorpayOrderResponse>("/payments/razorpay/initiate", {
    booking_id: bookingId,
    amount,
  });
  return response.data;
}

// Backward compatible alias
export const createRazorpayOrder = initiatePayment;

// 3. Step 3: Confirm & Verify Payment Signature
export async function confirmPayment(data: RazorpayVerifyPayload): Promise<RazorpayVerifyResponse> {
  const response = await api.post<RazorpayVerifyResponse>("/payments/razorpay/confirm", data);
  return response.data;
}

// Backward compatible alias
export const verifyRazorpayPayment = confirmPayment;


