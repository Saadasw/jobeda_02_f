import { api } from '@/api/client';

/** Payment methods accepted across the app (Take Payment + history filter). */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile', label: 'Mobile banking' },
  { value: 'cheque', label: 'Cheque' },
] as const;

export interface CreatePaymentPayload {
  student_id: number;
  amount: number;
  date: string;
  method: string;
  cash_account_id?: number;
}

export interface PaymentResponse {
  id: number;
  student_id: number | null;
  amount: number | string;
  date: string;
  method: string;
  status?: string | null;
  receipt_no?: string | null;
}

export interface AllocationRow {
  id: number;
  payment_id: number;
  fee_assignment_id: number;
  amount: number | string;
}

export interface AllocateResult {
  payment_id: number;
  allocated: number | string;
  advance: number | string;
  allocations: AllocationRow[];
}

export function createPayment(payload: CreatePaymentPayload): Promise<PaymentResponse> {
  return api.post<PaymentResponse>('/payments', payload).then((r) => r.data);
}

export function allocatePayment(paymentId: number): Promise<AllocateResult> {
  return api.post<AllocateResult>(`/payments/${paymentId}/allocate`, {}).then((r) => r.data);
}
