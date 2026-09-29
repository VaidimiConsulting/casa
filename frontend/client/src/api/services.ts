import api from "./axios";

export interface RoomServiceRequest {
  id: number;
  request_number: string;
  room_number: string;
  guest_name: string;
  service_type: string;
  quantity: number;
  notes: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export async function fetchServices(params?: { status?: string; search?: string }): Promise<RoomServiceRequest[]> {
  const res = await api.get<{ success: boolean; services: RoomServiceRequest[] }>("/services", { params });
  return res.data.services;
}

export async function createServiceRequest(data: Partial<RoomServiceRequest>) {
  const res = await api.post("/services", data);
  return res.data;
}

export async function updateServiceStatus(id: number, status: string) {
  const res = await api.put(`/services/${id}/status`, { status });
  return res.data;
}

export async function deleteServiceRequest(id: number) {
  const res = await api.delete(`/services/${id}`);
  return res.data;
}
