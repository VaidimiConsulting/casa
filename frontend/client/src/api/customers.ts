import api from "./axios";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  total_bookings: number;
  total_orders: number;
  total_spent: number;
}

export interface CustomerDetails extends Customer {
  bookings: any[];
  orders: any[];
  payments: any[];
}

export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const params = search ? { search } : {};
  const response = await api.get<{ success: boolean; customers: Customer[] }>("/customers", { params });
  return response.data.customers;
}

export async function fetchCustomerDetails(id: number): Promise<CustomerDetails> {
  const response = await api.get<{ success: boolean; customer: CustomerDetails }>(`/customers/${id}`);
  return response.data.customer;
}
