import api from "./axios";

export interface PatioBooking {
  id: number;
  booking_ref: string;
  host_name: string;
  host_email: string;
  host_phone: string;
  event_type: string;
  event_date: string;
  time_slot: string;
  guest_count: number;
  food_menu_type: string;
  special_requests?: string;
  base_venue_price: number;
  food_price_per_head: number;
  estimated_total: number;
  final_quote_amount: number;
  advance_paid: number;
  payment_status: "pending" | "advance_paid" | "paid" | "refunded";
  payment_method: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export interface PatioBookingData {
  host_name: string;
  host_email: string;
  host_phone: string;
  event_type: string;
  event_date: string;
  time_slot: string;
  guest_count: number;
  food_menu_type: string;
  special_requests?: string;
}

// Public: Book patio event / request quote
export async function bookPatioEvent(data: PatioBookingData) {
  const response = await api.post<{
    success: boolean;
    message: string;
    bookingId: number;
    bookingRef: string;
    pricing: {
      baseVenuePrice: number;
      foodRate: number;
      guestCount: number;
      estimatedTotal: number;
    };
  }>("/patio/book", data);
  return response.data;
}

// Admin / Staff: Get all patio bookings
export async function fetchPatioBookings(params?: { status?: string; search?: string }): Promise<PatioBooking[]> {
  const response = await api.get<{ success: boolean; bookings: PatioBooking[] }>("/patio/bookings", { params });
  return response.data.bookings || [];
}

// Admin / Staff: Update status & quote amount
export async function updatePatioBookingStatus(
  id: number,
  data: { status: string; final_quote_amount?: number; notes?: string }
) {
  const response = await api.put(`/patio/bookings/${id}/status`, data);
  return response.data;
}

// Admin / Staff: Update payment details
export async function updatePatioPayment(
  id: number,
  data: { payment_status: string; advance_paid?: number; payment_method?: string }
) {
  const response = await api.put(`/patio/bookings/${id}/payment`, data);
  return response.data;
}

// Admin / Staff: Delete booking
export async function deletePatioBooking(id: number) {
  const response = await api.delete(`/patio/bookings/${id}`);
  return response.data;
}
