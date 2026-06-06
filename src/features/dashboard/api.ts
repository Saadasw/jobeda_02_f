import { api } from '@/api/client';

export interface DashboardSummary {
  today_collection: number;
  today_expense: number;
  total_students: number;
  total_employees: number;
  total_due: number;
  cash_balance: number;
  pending_payments: number;
}

export interface AgingBucket {
  bucket: string;
  fee_count: number;
  overdue_amount: number;
}

export interface AgingReport {
  as_of: string | null;
  buckets: AgingBucket[];
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/reports/dashboard').then((r) => r.data);
}

export function getOverdueAging(): Promise<AgingReport> {
  return api.get<AgingReport>('/late-fees/aging').then((r) => r.data);
}
