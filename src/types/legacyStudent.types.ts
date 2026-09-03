/**
 * Types TypeScript pour le module Gestion des Anciens Étudiants (< 2023)
 * Couvre l'identification, la régularisation et la gestion complète des services étudiants rétroactifs.
 */

export type LegacyStudentStatus = 'pending' | 'validated' | 'rejected';

export type LegacyServiceType =
  | 'quitus_memoire'
  | 'attestation_diplome'
  | 'attestation_frequentation'
  | 'demande_bulletin'
  | 'correction_memoire'
  | 'reclamation_notes'
  | 'verification_infos';

export type LegacyServiceStatus =
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'delivered'
  | 'rejected';

export interface LegacyFiliere {
  id: number | string;
  name: string;
  abbreviation?: string;
  cycle?: string;
  cycle_id?: number;
}

export interface LegacyStudentServiceRequest {
  id: number | string;
  legacy_student_id?: number | string;
  matricule?: string;
  student_name?: string;
  email?: string;
  phone?: string;
  service_type?: LegacyServiceType;
  service_name: string;
  filiere_name?: string;
  enrollment_year?: number;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  status: LegacyServiceStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  document_url?: string | null;
}

export interface LegacyStudent {
  id: number | string;
  matricule: string;
  last_name: string;
  first_name: string;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  cycle?: string | null;
  email: string;
  phone: string;
  enrollment_year: number;
  department: LegacyFiliere | null;
  filieres?: LegacyFiliere[];
  status: LegacyStudentStatus;
  rejection_reason?: string | null;
  notes_admin?: string | null;
  services_requested?: LegacyStudentServiceRequest[];
  services_count?: number;
  validated_by?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface LegacyStudentFormData {
  matricule: string;
  last_name: string;
  first_name: string;
  date_of_birth?: string;
  place_of_birth?: string;
  cycle?: string;
  email: string;
  phone: string;
  enrollment_year: number;
  department_id: number | string | '';
  notes_admin?: string;
}

export interface LegacyStudentFilters {
  search?: string;
  status?: LegacyStudentStatus | 'all';
  cycle?: string;
  enrollment_year?: number | string;
  department_id?: number | string;
  page?: number;
  per_page?: number;
}

export interface LegacyServiceFilters {
  search?: string;
  service_type?: LegacyServiceType | 'all';
  status?: LegacyServiceStatus | 'all';
  enrollment_year?: number | string;
  department_id?: number | string;
  page?: number;
  per_page?: number;
}

export interface LegacyStudentStats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
  services_total?: number;
  services_pending?: number;
  services_delivered?: number;
}

export interface LegacyStudentPaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from?: number;
  to?: number;
}

export interface LegacyStudentListResponse {
  success: boolean;
  data: LegacyStudent[];
  meta: LegacyStudentPaginationMeta;
  stats?: LegacyStudentStats;
}

export interface LegacyServicesListResponse {
  success: boolean;
  data: LegacyStudentServiceRequest[];
  meta: LegacyStudentPaginationMeta;
}

// ── Dossier académique rétroactif ─────────────────────────────────────────

export interface AcademicCourse {
  name: string;
  code?: string;
  professor?: string;
  credits: number;
  coefficient: number;
  grade: number;        // note /20
  retake_grade?: number | null;
  semester?: string;
}

export interface AcademicRecord {
  id?: number | string;
  legacy_student_id?: number | string;
  academic_year: string;          // ex: "2018-2019"
  level?: string | null;          // ex: "Licence 3"
  semester?: string | null;       // ex: "S1", "S2", "S1+S2"
  general_average?: number | null;
  total_credits?: number | null;
  obtained_credits?: number | null;
  decision?: string | null;       // "pass" | "fail" | "repeat" | "Admis(e)" | ...
  mention?: string | null;        // "Passable" | "Assez Bien" | "Bien" | ...
  thesis_title?: string | null;
  thesis_grade?: number | null;
  thesis_date?: string | null;
  quitus_accorded?: boolean;
  courses: AcademicCourse[];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

