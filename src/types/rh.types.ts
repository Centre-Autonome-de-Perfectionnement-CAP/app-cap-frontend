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

export interface CourseSupport {
  title: string
  file?: string
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
  | 'resiliated'   // Lien expiré — 72 h dépassées sans signature du professeur

export interface ProfessorProgram {
  id: number
  is_primary: boolean
  label: string
  hours?: number

  number_monographie?: number | null
  amount_monographie?: number | null
 
  /** Montant par heure défini dans le contrat (colonne pivot) */
  amount_per_hour?: number | null
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

  is_validated?: boolean
  validation_date?: string
  rejection_reason?: string
  is_authorized?: boolean
  authorization_date?: string


  /**
   * Date/heure d'envoi de l'e-mail de transfert.
   * Référence pour l'expiration du lien après 72 heures.
   */
  transferred_at?: string

  /** Signature électronique */

  professor_signature_path?: string
  professor_signature_url?: string
  professor_signature_type?: 'drawn' | 'uploaded'
  professor_signed_at?: string

  pdf_path?: string
  pdf_url?: string
  pdf_uploaded_at?: string

  amount_monographie?: number

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
  /** Montant par heure par programme : clé = course_element_professor id, valeur = montant */
  program_amounts?: Record<number | string, number>
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


/**
 * Un fichier individuel dans la colonne factures_normalisees (JSON)
 */
export interface FactureFile {
  /** Nom original du fichier uploadé */
  name: string
  /** Chemin relatif sur le disque public (ex: "factures_normalisees/...") */
  path: string
  /** Type du document */
  type: 'facture' | 'rib' | 'autre'
  /** URL publique directe pour ouvrir/télécharger le fichier */
  url: string
}

/**
 * Un contrat retourné par GET /professor/my-factures
 * Contient les infos de base du contrat + la liste de ses factures
 */
export interface FactureEntry {
  id: number
  contrat_number: string
  status: ContratStatus
  amount: number
  start_date: string
  end_date?: string
  academic_year?: string
  cycle?: string
  /** Liste des fichiers déposés pour ce contrat */
  factures: FactureFile[]
  uploaded_at: string
}

