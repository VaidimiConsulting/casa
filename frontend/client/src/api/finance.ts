import api from "./axios";

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  description: string;
  created_at: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}

export async function getFinanceSummary(month?: number, year?: number, day?: number | "") {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;
  if (day) params.day = day;
  const response = await api.get<{ success: boolean; summary: FinanceSummary; month: number; year: number; day?: number }>("/finance/summary", { params });
  return response.data;
}

export async function getExpenses(month?: number, year?: number, day?: number | "") {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;
  if (day) params.day = day;
  const response = await api.get<{ success: boolean; expenses: Expense[] }>("/finance/expenses", { params });
  return response.data.expenses;
}

export async function addExpense(data: { title: string; amount: number; category: string; expense_date: string; description: string }) {
  const response = await api.post<{ success: boolean; expense: Expense; message: string }>("/finance/expenses", data);
  return response.data;
}

export async function deleteExpense(id: number) {
  const response = await api.delete<{ success: boolean; message: string }>(`/finance/expenses/${id}`);
  return response.data;
}
