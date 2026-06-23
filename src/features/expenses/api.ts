import { api } from '@/api/client';

export interface Expense {
  id: number;
  account_id: number;
  amount: number | string;
  date: string;
  description: string | null;
}

export interface CreateExpensePayload {
  account_id: number;
  amount: number;
  date: string;
  description?: string;
}

export interface ExpenseListParams {
  from?: string;
  to?: string;
  limit?: number;
}
export const listExpenses = (params: ExpenseListParams = {}) =>
  api.get<Expense[]>('/expenses', { params }).then((r) => r.data);
export const createExpense = (b: CreateExpensePayload) =>
  api.post<Expense>('/expenses', b).then((r) => r.data);
