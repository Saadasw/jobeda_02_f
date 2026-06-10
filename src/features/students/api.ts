import { api } from '@/api/client';

// Money fields vary by endpoint (number from /students & /reports, string from
// /summary because Pydantic serializes Decimal as a string) — keep both.
type Money = number | string;

export interface StudentRow {
  id: number;
  name: string;
  registration_no: string | null;
  class: string | null;
  class_id: number | null;
  section_id: number | null;
  section: string | null;
  roll_no: number | null;
  fee_group: string | null;
  total_fee: Money;
  total_paid: Money;
  due: Money;
  advance: Money;
  last_payment_date: string | null;
}

export interface StudentListResponse {
  data: StudentRow[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface StudentDetail {
  id: number;
  name: string;
  registration_no: string | null;
  class: string | null;
  class_id: number | null;
  section_id: number | null;
  section: string | null;
  roll_no: number | null;
  academic_year_id: number | null;
  admission_date: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  guardian_id: number | null;
  fee_group_id: number | null;
  created_at: string | null;
}

export interface StudentSummary {
  student_id: number;
  student_name: string;
  total_fee: Money;
  total_paid: Money;
  due: Money;
  advance: Money;
}

export interface FeeDetailRow {
  fee_id: number;
  fee_type_name: string | null;
  month: string;
  due_date: string | null;
  gross_amount: Money;
  discount: Money;
  net_amount: Money;
  paid: Money;
  due: Money;
  status: string | null;
}

export interface FeeDetailResponse {
  data: FeeDetailRow[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** student_enrollments.status values (migration 038 CHECK constraint). */
export const ENROLLMENT_STATUSES = [
  'active',
  'promoted',
  'graduated',
  'transferred',
  'dropped',
  'archived',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type Gender = 'male' | 'female' | 'other';

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: number;
  section_id?: number;
  status?: string;
  has_dues?: boolean;
}

export function listStudents(params: ListStudentsParams): Promise<StudentListResponse> {
  return api.get<StudentListResponse>('/students', { params }).then((r) => r.data);
}

export interface CreateStudentPayload {
  name: string;
  class?: string;
  class_id?: number;
  section_id?: number;
  academic_year_id?: number;
  admission_date?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  guardian_id?: number;
  fee_group_id?: number;
}

export function createStudent(payload: CreateStudentPayload): Promise<StudentDetail> {
  return api.post<StudentDetail>('/students', payload).then((r) => r.data);
}

export interface UpdateStudentPayload {
  name?: string;
  admission_date?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  fee_group_id?: number;
  guardian_id?: number;
}

export function updateStudent(id: number, payload: UpdateStudentPayload): Promise<StudentDetail> {
  return api.put<StudentDetail>(`/students/${id}`, payload).then((r) => r.data);
}

export function getStudent(id: number): Promise<StudentDetail> {
  return api.get<StudentDetail>(`/students/${id}`).then((r) => r.data);
}

export function getStudentSummary(id: number): Promise<StudentSummary> {
  return api.get<StudentSummary>(`/students/${id}/summary`).then((r) => r.data);
}

export function getStudentFeeDetails(
  studentId: number,
  params: { page?: number; limit?: number } = {},
): Promise<FeeDetailResponse> {
  return api
    .get<FeeDetailResponse>('/reports/fee-details', {
      params: { student_id: studentId, ...params },
    })
    .then((r) => r.data);
}

// ─── Payment history ─────────────────────────────────────────────────────────

export interface StudentPaymentRow {
  id: number;
  date: string;
  amount: Money;
  method: string | null;
  status: string | null;
  receipt_no: string | null;
}

export interface StudentPaymentParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  method?: string;
  status?: string;
}

export function getStudentPayments(
  studentId: number,
  params: StudentPaymentParams = {},
): Promise<StudentPaymentRow[]> {
  return api
    .get<StudentPaymentRow[]>(`/students/${studentId}/payments`, { params })
    .then((r) => r.data);
}
