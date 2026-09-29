import api from "./axios";

export async function fetchSettings(): Promise<Record<string, string>> {
  const response = await api.get<{ success: boolean; settings: Record<string, string> }>("/settings");
  return response.data.settings;
}

export async function saveSettings(settings: Record<string, string>) {
  const response = await api.put("/settings", { settings });
  return response.data;
}
