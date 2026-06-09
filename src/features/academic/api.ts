import { api } from '@/api/client';

/** Academic structure lookups — feed the admission form and list filters. */

export interface ClassRow {
  id: number;
  name: string;
}

export interface SectionRow {
  id: number;
  class_id: number;
  name: string;
}

export interface AcademicYearRow {
  id: number;
  name: string;
  is_current?: boolean;
}

export function listClasses(): Promise<ClassRow[]> {
  return api.get<ClassRow[]>('/classes').then((r) => r.data);
}

/** Sections, optionally scoped to a class (section names like "A"/"B" repeat across classes). */
export function listSections(classId?: number): Promise<SectionRow[]> {
  return api
    .get<SectionRow[]>('/sections', { params: classId ? { class_id: classId } : undefined })
    .then((r) => r.data);
}

export function listAcademicYears(): Promise<AcademicYearRow[]> {
  return api.get<AcademicYearRow[]>('/academic-years').then((r) => r.data);
}
