import api from "./axios";

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  alt_text?: string;
  is_active: number | boolean;
  created_at: string;
}

// Public / User side: Fetch active gallery items
export async function fetchGallery(all = false): Promise<GalleryItem[]> {
  const response = await api.get<{ success: boolean; gallery: GalleryItem[] }>("/gallery", {
    params: { all },
  });
  return response.data.gallery || [];
}

// Upload file directly to backend uploads/gallery
export async function uploadGalleryPhoto(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post<{ success: boolean; url: string; filename: string }>(
    "/gallery/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

// Create new gallery item entry
export async function createGalleryItem(data: {
  title: string;
  category?: string;
  image_url: string;
  alt_text?: string;
}): Promise<GalleryItem> {
  const response = await api.post("/gallery", data);
  return response.data;
}

// Delete gallery item
export async function deleteGalleryItem(id: number): Promise<void> {
  await api.delete(`/gallery/${id}`);
}

// Toggle active status
export async function toggleGalleryStatus(id: number, isActive: boolean): Promise<void> {
  await api.put(`/gallery/${id}/status`, { is_active: isActive });
}

// Update gallery item details (Full CRUD Update)
export async function updateGalleryItem(
  id: number,
  data: {
    title: string;
    category?: string;
    image_url: string;
    alt_text?: string;
    is_active?: boolean | number;
  }
): Promise<void> {
  await api.put(`/gallery/${id}`, data);
}

