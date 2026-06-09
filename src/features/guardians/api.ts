import { api } from '@/api/client';

/** Guardians group siblings (students.guardian_id) and hold the SMS contact. */

export const GUARDIAN_RELATIONS = [
  'father',
  'mother',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'brother',
  'sister',
  'guardian',
  'other',
] as const;
export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

export interface Guardian {
  id: number;
  name: string;
  phone: string | null;
  relation: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
}

export interface CreateGuardianPayload {
  name: string;
  phone?: string;
  relation?: GuardianRelation;
  email?: string;
  occupation?: string;
  address?: string;
}

export function listGuardians(params: { search?: string; limit?: number } = {}): Promise<Guardian[]> {
  return api.get<Guardian[]>('/guardians', { params }).then((r) => r.data);
}

export function getGuardian(id: number): Promise<Guardian> {
  return api.get<Guardian>(`/guardians/${id}`).then((r) => r.data);
}

export function createGuardian(payload: CreateGuardianPayload): Promise<Guardian> {
  return api.post<Guardian>('/guardians', payload).then((r) => r.data);
}
