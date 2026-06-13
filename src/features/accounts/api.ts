import { api } from '@/api/client';

/** Chart of Accounts — the GL buckets the ledger sorts money into. */

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface Account {
  id: number;
  name: string;
  type: string;
  parent_id: number | null;
  is_active: boolean | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
}

export interface AccountCreatePayload {
  name: string;
  type: string;
  parent_id?: number;
}

export interface AccountUpdatePayload {
  name?: string;
  type?: string;
  is_active?: boolean;
}

export const listAccounts = () => api.get<Account[]>('/accounts').then((r) => r.data);
export const createAccount = (b: AccountCreatePayload) =>
  api.post<Account>('/accounts', b).then((r) => r.data);
export const updateAccount = (id: number, b: AccountUpdatePayload) =>
  api.put<Account>(`/accounts/${id}`, b).then((r) => r.data);

/**
 * Accounts referenced by LITERAL NAME inside the journal triggers / seed / views.
 * Renaming or removing these breaks auto-journaling, so the UI locks them.
 * (Other accounts — incl. Hostel/Exam Fees, expenses — are resolved by id and safe to rename.)
 */
export const PROTECTED_ACCOUNT_NAMES = new Set<string>([
  // top-level structure (parent lookups in the seed + tenant-default functions)
  'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses',
  // core system accounts
  'Cash', 'Bank', 'Accounts Receivable', 'Unearned Revenue', 'Opening Balance',
  // trigger-referenced by literal name
  'Tuition Fees', 'Fee Discount', 'Late Fee Income', 'Salary Expense',
]);

export function isProtectedAccount(name: string): boolean {
  return PROTECTED_ACCOUNT_NAMES.has(name);
}
