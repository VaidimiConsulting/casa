import api from "./axios";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "user" | "admin" | "receptionist";
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  if (response.data.token) {
    localStorage.setItem("casanest_token", response.data.token);
    localStorage.setItem("casanest_user", JSON.stringify(response.data.user));
  }
  return response.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  if (response.data.token) {
    localStorage.setItem("casanest_token", response.data.token);
    localStorage.setItem("casanest_user", JSON.stringify(response.data.user));
  }
  return response.data;
}

export async function getProfile() {
  const response = await api.get<{ success: boolean; user: AuthUser }>("/auth/profile");
  if (response.data.user) {
    localStorage.setItem("casanest_user", JSON.stringify(response.data.user));
  }
  return response.data;
}

export async function updateProfile(data: { name: string; phone?: string; currentPassword?: string; newPassword?: string }) {
  const response = await api.put<{ success: boolean; message: string; user: AuthUser }>("/auth/profile", data);
  if (response.data.user) {
    localStorage.setItem("casanest_user", JSON.stringify(response.data.user));
  }
  return response.data;
}

export function logout() {
  localStorage.removeItem("casanest_token");
  localStorage.removeItem("casanest_user");
}

export function getCurrentUser(): AuthUser | null {
  const user = localStorage.getItem("casanest_user");
  return user ? JSON.parse(user) : null;
}

