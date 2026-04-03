// ─── AdminUser ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  uuid: string
  first_name: string
  last_name: string
  full_name?: string
  email: string
  phone?: string
  rib_number?: string
  rib?: string
  rib_url?: string
  photo?: string
  photo_url?: string
  ifu_number?: string
  ifu?: string
  ifu_url?: string
  bank?: string
  email_verified_at?: string
  roles?: Role[]
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface CreateAdminUserRequest {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
  rib_number?: string
  rib?: File
  photo?: File
  ifu_number?: string
  ifu?: File
  bank?: string
}

export interface UpdateAdminUserRequest {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  phone?: string
  rib_number?: string
  rib?: File
  photo?: File
  ifu_number?: string
  ifu?: File
  bank?: string
}

export interface RhStats {
  total_professors: number
  total_admin_users: number
  active_professors: number
}

// ─── Contrat ──────────────────────────────────────────────────────────────────

export type ContratStatus =
  | 'pending'
  | 'signed'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'transfered'

/**
 * Un programme = assignation Professeur + Matière (ECUE) + Classe
 * Correspond à une ligne dans course_element_professor
 */
export interface ProfessorProgram {
  id: number
  is_primary: boolean
  label: string
  course_element: {
    id: number
    name: string
    code: string
    teaching_unit: {
      id: number
      name: string
      code: string
    }
  }
  class_group: {
    id: number
    name: string
  } | null
}

export interface Contrat {
  id: number
  uuid?: string
  contrat_number: string
  division?: string
  professor_id: number
  academic_year_id: number
  cycle_id?: number
  regroupement?: string
  start_date: string
  end_date?: string
  amount: number
  status: ContratStatus
  notes?: string

  /** Validé par le professeur via le lien email */
  is_validated?: boolean
  validation_date?: string

  /** Motif de rejet saisi par le professeur */
  rejection_reason?: string

  /** Autorisé par l'admin après validation du professeur */
  is_authorized?: boolean
  authorization_date?: string

  professor?: {
    id: number
    full_name: string
    nationality?: string
    profession?: string
    city?: string
    district?: string
    plot_number?: string
    house_number?: string
    ifu_number?: string
    rib_number?: string
    bank?: string
    email?: string
    phone?: string
  }
  academicYear?: { id: number; academic_year: string }
  cycle?: { id: number; name: string }
  course_element_professors?: ProfessorProgram[]
  created_at?: string
  updated_at?: string
}

export interface CreateContratPayload {
  division?: string | null
  professor_id: number
  academic_year_id: number
  cycle_id?: number | null
  regroupement?: string | null
  start_date: string
  end_date?: string | null
  amount: number
  notes?: string | null
  course_element_professor_ids?: number[]
}

export interface UpdateContratPayload extends CreateContratPayload {
  status: ContratStatus
}

// ─── AcademicYear ─────────────────────────────────────────────────────────────

export interface AcademicYear {
  id: number
  uuid?: string
  academic_year: string
  libelle?: string
  year_start?: string
  year_end?: string
  is_current?: boolean
  created_at: string
  updated_at: string
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

export interface Cycle {
  id: number
  name: string
  abbreviation?: string
}
