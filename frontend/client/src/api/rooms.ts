import api from "./axios";

export interface RoomOccupancyInfo {
  is_occupied: boolean;
  occupancy_status: "vacant" | "occupied";
  free_on_date: string | null;
  free_on_time: string;
  days_until_free: number;
  summary_label: string;
  current_booking?: {
    id: number;
    guest_name: string;
    guest_email: string;
    guest_phone: string | null;
    check_in: string;
    check_out: string;
    total_amount: number;
    payment_status: string;
  } | null;
  next_booking?: {
    id: number;
    guest_name: string;
    check_in: string;
    check_out: string;
    days_until_checkin: number;
  } | null;
}

export interface Room {
  id: number;
  name: string;
  description: string | null;
  room_type: string | null;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  image: string | null;
  status: "available" | "unavailable";
  occupancy?: RoomOccupancyInfo;
  created_at?: string;
  updated_at?: string;
}

export async function fetchRooms(status?: "available" | "unavailable"): Promise<Room[]> {
  const params = status ? { status } : {};
  const response = await api.get<{ success: boolean; rooms: Room[] }>("/rooms", { params });
  return response.data.rooms;
}

export async function fetchRoom(id: number): Promise<Room> {
  const response = await api.get<{ success: boolean; room: Room }>(`/rooms/${id}`);
  return response.data.room;
}

export async function createRoom(data: Partial<Room>): Promise<{ success: boolean; roomId: number }> {
  const response = await api.post<{ success: boolean; message: string; roomId: number }>("/rooms", data);
  return response.data;
}

export async function updateRoom(id: number, data: Partial<Room>): Promise<{ success: boolean; message: string; room?: Partial<Room> }> {
  const response = await api.put<{ success: boolean; message: string; room?: Partial<Room> }>(`/rooms/${id}`, data);
  return response.data;
}

export async function bulkAdjustPrices(data: {
  roomIds?: number[];
  adjustmentType: "fixed" | "percent";
  action: "increase" | "decrease";
  amount: number;
}): Promise<{ success: boolean; message: string; affectedRows: number }> {
  const response = await api.post<{ success: boolean; message: string; affectedRows: number }>("/rooms/bulk-price-adjust", data);
  return response.data;
}

export async function deleteRoom(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/rooms/${id}`);
  return response.data;
}
