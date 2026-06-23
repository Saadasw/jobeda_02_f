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

export const listExpenses = () =>
  api.get<Expense[]>('/expenses', { params: { limit: 100 } }).then((r) => r.data);
export const createExpense = (b: CreateExpensePayload) =>
  api.post<Expense>('/expenses', b).then((r) => r.data);
