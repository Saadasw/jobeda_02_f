import { api } from '@/api/client';

export interface Income {
  id: number;
  account_id: number;
  amount: number | string;
  date: string;
  description: string | null;
}

export interface CreateIncomePayload {
  account_id: number;
  amount: number;
  date: string;
  description?: string;
}

export const listIncome = () =>
  api.get<Income[]>('/income', { params: { limit: 100 } }).then((r) => r.data);
export const createIncome = (b: CreateIncomePayload) =>
  api.post<Income>('/income', b).then((r) => r.data);
