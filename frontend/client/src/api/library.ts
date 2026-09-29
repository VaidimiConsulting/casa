import api from "./axios";

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn?: string;
  cover_image?: string;
  description?: string;
  total_copies: number;
  available_copies: number;
  location: string;
  is_active: number | boolean;
  created_at: string;
}

export interface LibraryLoan {
  id: number;
  book_id: number;
  user_id?: number | null;
  guest_name: string;
  room_number: string;
  phone?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: "active" | "returned" | "overdue";
  notes?: string;
  created_at: string;
  book_title?: string;
  book_author?: string;
  book_cover?: string;
  book_genre?: string;
  book_location?: string;
}

// Fetch all books (with optional filters)
export async function fetchBooks(params?: {
  genre?: string;
  search?: string;
  all?: boolean;
}): Promise<LibraryBook[]> {
  const response = await api.get<{ success: boolean; data: LibraryBook[] }>("/library/books", {
    params,
  });
  return response.data.data || [];
}

// Fetch single book by ID
export async function fetchBookById(id: number): Promise<LibraryBook> {
  const response = await api.get<{ success: boolean; data: LibraryBook }>(`/library/books/${id}`);
  return response.data.data;
}

// Add new book (Admin / Staff)
export async function addBook(bookData: {
  title: string;
  author: string;
  genre?: string;
  isbn?: string;
  cover_image?: string;
  description?: string;
  total_copies?: number;
  location?: string;
}): Promise<LibraryBook> {
  const response = await api.post<{ success: boolean; data: LibraryBook }>("/library/books", bookData);
  return response.data.data;
}

// Update existing book (Admin / Staff)
export async function updateBook(
  id: number,
  bookData: Partial<LibraryBook>
): Promise<LibraryBook> {
  const response = await api.put<{ success: boolean; data: LibraryBook }>(`/library/books/${id}`, bookData);
  return response.data.data;
}

// Delete book (Admin / Staff)
export async function deleteBook(id: number): Promise<void> {
  await api.delete(`/library/books/${id}`);
}

// Fetch loans list (Admin / Staff)
export async function fetchLoans(params?: {
  status?: string;
  room?: string;
  search?: string;
}): Promise<LibraryLoan[]> {
  const response = await api.get<{ success: boolean; data: LibraryLoan[] }>("/library/loans", {
    params,
  });
  return response.data.data || [];
}

// Issue a book to a guest / room (Admin / Staff)
export async function issueBook(loanData: {
  book_id: number;
  user_id?: number | null;
  guest_name: string;
  room_number: string;
  phone?: string;
  due_date: string;
  notes?: string;
}): Promise<LibraryLoan> {
  const response = await api.post<{ success: boolean; data: LibraryLoan; message: string }>(
    "/library/loans",
    loanData
  );
  return response.data.data;
}

// Mark book returned (Admin / Staff)
export async function returnBook(loanId: number): Promise<LibraryLoan> {
  const response = await api.put<{ success: boolean; data: LibraryLoan; message: string }>(
    `/library/loans/${loanId}/return`
  );
  return response.data.data;
}

// Fetch user's own borrowed books (Authenticated User)
export async function fetchMyLoans(): Promise<LibraryLoan[]> {
  const response = await api.get<{ success: boolean; data: LibraryLoan[] }>("/library/my-loans");
  return response.data.data || [];
}
