import api from "./axios";

export interface Booking {
  id: number;
  user_id: number | null;
  room_id: number | null;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests: number;
  males?: number;
  females?: number;
  children?: number;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
  created_at: string;
  updated_at?: string;
  room_name?: string;
  room_type?: string;
  price_per_night?: number;
  room_image?: string;
  payment_method?: string;
  transaction_id?: string;
  payment_amount?: number;
  payment_date?: string;
}

export interface BookingData {
  room_id?: number | number[] | null;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests?: number;
  males?: number;
  females?: number;
  children?: number;
  notes?: string;
  payment_method?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId: number;
  total_amount: number;
}

export async function createBooking(data: BookingData): Promise<BookingResponse> {
  const response = await api.post<BookingResponse>("/bookings", data);
  return response.data;
}

export async function getBookings(): Promise<Booking[]> {
  const response = await api.get<{ success: boolean; bookings: Booking[] }>("/bookings");
  return response.data.bookings;
}

export async function getBookingById(id: number): Promise<Booking> {
  const response = await api.get<{ success: boolean; booking: Booking }>(`/bookings/${id}`);
  return response.data.booking;
}

export async function updateBooking(
  id: number,
  data: {
    status?: string;
    payment_status?: string;
    payment_method?: string;
    transaction_id?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const response = await api.put<{ success: boolean; message: string }>(`/bookings/${id}`, data);
  return response.data;
}

export async function deleteBooking(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/bookings/${id}`);
  return response.data;
}

export interface BookedDateRange {
  check_in: string;
  check_out: string;
  status: string;
}

export async function fetchRoomBookedDates(roomId: number): Promise<BookedDateRange[]> {
  const response = await api.get<{ success: boolean; bookedDates: BookedDateRange[] }>(
    `/bookings/room/${roomId}/booked-dates`
  );
  return response.data.bookedDates || [];
}

export async function cancelBooking(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.put<{ success: boolean; message: string }>(`/bookings/${id}/cancel`);
  return response.data;
}

export async function payBooking(
  id: number,
  data: {
    payment_method: string;
    transaction_id?: string;
    payment_amount?: number;
  }
): Promise<{ success: boolean; message: string; transaction_id: string; payment_method: string }> {
  const response = await api.post<{
    success: boolean;
    message: string;
    transaction_id: string;
    payment_method: string;
  }>(`/bookings/${id}/pay`, data);
  return response.data;
}

