import { api } from '@/api/client';

type Money = number | string;

// ─── Fee types (for the structure-item editor & manual generate) ─────────────
export interface FeeType {
  id: number;
  name: string | null;
  frequency: string | null;
  is_recurring: boolean | null;
  account_id: number | null;
}
export const listFeeTypes = () => api.get<FeeType[]>('/fee-types').then((r) => r.data);

export const FEE_TYPE_FREQUENCIES = ['monthly', 'termly', 'annual', 'one_time', 'adhoc'] as const;

export interface FeeTypePayload {
  name: string;
  frequency: string;
  account_id: number;
  is_recurring: boolean;
}
export const createFeeType = (b: FeeTypePayload) =>
  api.post<FeeType>('/fee-types', b).then((r) => r.data);
export const updateFeeType = (id: number, b: Partial<FeeTypePayload>) =>
  api.put<FeeType>(`/fee-types/${id}`, b).then((r) => r.data);
export const deleteFeeType = (id: number) =>
  api.delete(`/fee-types/${id}`).then((r) => r.data);

// ─── Fee groups ──────────────────────────────────────────────────────────────
export interface FeeGroup {
  id: number;
  name: string;
  description: string | null;
}
export interface FeeGroupPayload {
  name: string;
  description?: string;
}
export const listFeeGroups = () => api.get<FeeGroup[]>('/fee-groups').then((r) => r.data);
export const createFeeGroup = (b: FeeGroupPayload) =>
  api.post<FeeGroup>('/fee-groups', b).then((r) => r.data);
export const updateFeeGroup = (id: number, b: Partial<FeeGroupPayload>) =>
  api.put<FeeGroup>(`/fee-groups/${id}`, b).then((r) => r.data);
export const deleteFeeGroup = (id: number) =>
  api.delete(`/fee-groups/${id}`).then((r) => r.data);

// ─── Fee structures + items ──────────────────────────────────────────────────
export const STRUCTURE_FREQUENCIES = ['monthly', 'termly', 'annual', 'one_time'] as const;

export interface FeeStructureItem {
  id: number;
  fee_structure_id: number;
  fee_type_id: number;
  fee_type_name: string | null;
  amount: Money;
  frequency: string | null;
  due_day: number | null;
}
export interface FeeStructure {
  id: number;
  academic_year_id: number;
  class_id: number;
  class_name: string | null;
  fee_group_id: number;
  fee_group_name: string | null;
  name: string | null;
  items: FeeStructureItem[];
}
export const listStructures = (params: { academic_year_id?: number; class_id?: number }) =>
  api.get<FeeStructure[]>('/fee-structures', { params }).then((r) => r.data);
export const createStructure = (b: {
  academic_year_id: number;
  class_id: number;
  fee_group_id: number;
  name?: string;
}) => api.post<FeeStructure>('/fee-structures', b).then((r) => r.data);
export const deleteStructure = (id: number) =>
  api.delete(`/fee-structures/${id}`).then((r) => r.data);

export interface ItemPayload {
  fee_type_id: number;
  amount: number;
  frequency?: string;
  due_day?: number;
}
export const addItem = (sid: number, b: ItemPayload) =>
  api.post<FeeStructureItem>(`/fee-structures/${sid}/items`, b).then((r) => r.data);
export const updateItem = (sid: number, iid: number, b: Partial<ItemPayload>) =>
  api.put<FeeStructureItem>(`/fee-structures/${sid}/items/${iid}`, b).then((r) => r.data);
export const deleteItem = (sid: number, iid: number) =>
  api.delete(`/fee-structures/${sid}/items/${iid}`).then((r) => r.data);

// ─── Generation ──────────────────────────────────────────────────────────────
export interface GenerateResult {
  month: string;
  created: number;
  skipped: number;
  no_structure: number;
  students_in_scope: number;
  total_amount: number;
}
export const generateFees = (b: {
  academic_year_id: number;
  month: string;
  class_id?: number;
  section_id?: number;
  fee_type_ids?: number[];
  dry_run?: boolean;
}) => api.post<GenerateResult>('/fees/generate', b).then((r) => r.data);

export const generateFeesManual = (b: {
  academic_year_id: number;
  month: string;
  fee_type_id: number;
  amount: number;
  class_id?: number;
  section_id?: number;
  due_day?: number;
  dry_run?: boolean;
}) => api.post<GenerateResult>('/fees/generate-manual', b).then((r) => r.data);
