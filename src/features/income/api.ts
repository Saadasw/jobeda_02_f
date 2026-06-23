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

export interface IncomeListParams {
  from?: string;
  to?: string;
  limit?: number;
}
export const listIncome = (params: IncomeListParams = {}) =>
  api.get<Income[]>('/income', { params }).then((r) => r.data);
export const createIncome = (b: CreateIncomePayload) =>
  api.post<Income>('/income', b).then((r) => r.data);
