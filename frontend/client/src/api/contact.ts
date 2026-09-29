import api from "./axios";

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "unread" | "read" | "replied";
  reply: string | null;
  created_at: string;
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function sendContactMessage(data: ContactData) {
  const response = await api.post("/contact", data);
  return response.data;
}

export async function getContactMessages(params?: { status?: string; search?: string }): Promise<ContactMessage[]> {
  const response = await api.get<{ success: boolean; messages: ContactMessage[] }>("/contact", { params });
  return response.data.messages;
}

export async function updateContactStatus(id: number, data: { status: string; reply?: string }) {
  const response = await api.put(`/contact/${id}`, data);
  return response.data;
}

export async function deleteContactMessage(id: number) {
  const response = await api.delete(`/contact/${id}`);
  return response.data;
}
