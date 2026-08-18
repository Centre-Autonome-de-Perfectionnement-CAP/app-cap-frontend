/**
 * Types TypeScript pour le module Gestion des Anciens Étudiants (< 2023)
 * Rôle: Développeur 6
 */

export type LegacyStudentStatus = 'pending' | 'validated' | 'rejected';

export interface LegacyFiliere {
  id: number | string;
  name: string;
  abbreviation?: string;
  cycle?: string;
}

export interface LegacyStudentServiceRequest {
  id: number | string;
  service_name: string;
  requested_at: string;
  status: 'pending' | 'completed' | 'in_progress';
}

export interface LegacyStudent {
  id: number | string;
  matricule: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string;
  enrollment_year: number;
  department: LegacyFiliere | null;
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
  email: string;
  phone: string;
  enrollment_year: number;
  department_id: number | string | '';
  notes_admin?: string;
}

export interface LegacyStudentFilters {
  search?: string;
  status?: LegacyStudentStatus | 'all';
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
