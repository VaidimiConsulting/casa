import api from "./axios";

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "manager" | "receptionist" | "restaurant_staff";
  status: "active" | "inactive";
  created_at: string;
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const response = await api.get<{ success: boolean; staff: StaffMember[] }>("/staff");
  return response.data.staff;
}

export async function createStaff(data: Partial<StaffMember>) {
  const response = await api.post("/staff", data);
  return response.data;
}

export async function updateStaff(id: number, data: Partial<StaffMember>) {
  const response = await api.put(`/staff/${id}`, data);
  return response.data;
}

export async function toggleStaffStatus(id: number, status: "active" | "inactive") {
  const response = await api.put(`/staff/${id}/status`, { status });
  return response.data;
}

export async function deleteStaff(id: number) {
  const response = await api.delete(`/staff/${id}`);
  return response.data;
}
