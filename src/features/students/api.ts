import { api } from '@/api/client';

// Money fields vary by endpoint (number from /students & /reports, string from
// /summary because Pydantic serializes Decimal as a string) — keep both.
type Money = number | string;

export interface StudentRow {
  id: number;
  name: string;
  class: string | null;
  class_id: number | null;
  section_id: number | null;
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
  class: string | null;
  class_id: number | null;
  section_id: number | null;
  academic_year_id: number | null;
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

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function listStudents(params: ListStudentsParams): Promise<StudentListResponse> {
  return api.get<StudentListResponse>('/students', { params }).then((r) => r.data);
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
