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

// ─── Support de cours ─────────────────────────────────────────────────────────

/**
 * Une entrée dans le tableau JSON stocké dans contrat_programs.course_support_file
 */
export interface CourseSupport {
  /** Titre du support (ex: "Cours Chapitre 1 — Introduction") */
  title: string
  /** Chemin relatif du fichier sur le serveur (ex: "supports/uuid.pdf") */
  file?: string
  /** URL publique du fichier PDF (reconstruite côté serveur) */
  url?: string
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
  hours?: number
  /** Nombre de monographies saisies par l'admin pour ce programme */
  number_monographie?: number | null
  /** Montant de la monographie pour ce programme */
  amount_monographie?: number | null
  /** Supports de cours associés à ce programme dans le contexte d'un contrat */
  course_support_file?: CourseSupport[]
  course_element: {
    id: number
    name: string
    code: string
    hours?: number
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

  /** Signature électronique */
  professor_signature_path?: string
  professor_signature_url?: string
  professor_signature_type?: 'drawn' | 'uploaded'
  professor_signed_at?: string

  /** PDF final stocké (généré après validation ou uploadé par l'admin) */
  pdf_path?: string
  pdf_url?: string
  pdf_uploaded_at?: string

  /** Montant de la monographie (calculé = nb PDFs × montant unitaire) */
  amount_monographie?: number

  /**
   * Verrouillé = validé ou autorisé → plus de modification ni suppression
   */
  is_locked?: boolean

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
  academic_year?: { id: number; academic_year: string }
  cycle?: { id: number; name: string }
  /**
   * Programmes (course_element_professor) rattachés au contrat.
   * Chaque programme peut contenir ses supports de cours via `course_support_file`.
   */
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
  amount_monographie?: number | null
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