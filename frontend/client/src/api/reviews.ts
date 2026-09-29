import api from "./axios";

export interface Review {
  id: number;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  review: string;
  room_id: number | null;
  room_name?: string;
  is_approved: number;
  created_at: string;
}

export async function fetchReviews(approvedOnly = false): Promise<Review[]> {
  const response = await api.get<{ success: boolean; reviews: Review[] }>("/reviews", {
    params: { approvedOnly },
  });
  return response.data.reviews;
}

export async function createReview(data: Partial<Review>) {
  const response = await api.post("/reviews", data);
  return response.data;
}

export async function toggleReviewApproval(id: number, is_approved: boolean) {
  const response = await api.put(`/reviews/${id}/approval`, { is_approved });
  return response.data;
}

export async function deleteReview(id: number) {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
}
