import api from "./axios";

export interface UploadResponse {
  success: boolean;
  message: string;
  filename: string;
  url: string;
}

export async function uploadRoomImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<UploadResponse>("/upload/room-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
