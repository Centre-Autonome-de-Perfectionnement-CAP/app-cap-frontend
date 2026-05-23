// src/types/document-request.types.ts

export type DocumentRequestStatus =
  | 'submitted'
  | 'secretary_correction'
  | 'accounting_review'
  | 'division_manager_review'
  | 'cap_manager_review'
  | 'deputy_director_secretary_review'
  | 'deputy_director_review'
  | 'director_secretary_review'
  | 'director_review'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'rejected'

export type DocumentRequestType =
  | 'attestation_passage'
  | 'attestation_definitive'
  | 'attestation_inscription'
  | 'bulletin_notes'
  | 'bulletin_annuel'

export type SignatureType    = 'paraphe' | 'signature'
export type ChefDivisionType = 'formation_distance' | 'formation_continue'

export interface DocumentRequest {
  id: number
  reference: string
  type: DocumentRequestType
  status: DocumentRequestStatus
  email: string | null
  files: Record<string, string> | null | string
  complement_files: Record<string, string> | null | string
  submitted_at: string
  created_at?: string
  updated_at: string
  rejected_reason: string | null
  rejected_by: string | null
  chef_division_comment: string | null
  secretaire_comment: string | null
  comptable_comment: string | null
  signature_type: SignatureType | null
  department_name: string | null
  chef_division_type: ChefDivisionType | null
  chef_division_reviewed_at: string | null
  comptable_reviewed_at: string | null
  chef_cap_reviewed_at: string | null
  sec_dir_adjointe_reviewed_at: string | null
  directrice_adjointe_reviewed_at: string | null
  sec_directeur_reviewed_at: string | null
  delivered_at: string | null
  last_name: string
  first_names: string
  matricule: string
  department: string
  academic_year: string
  study_level?: string
  student_pending_student_id?: number
  has_flag?: boolean
  // ── Circuit de correction (ajoutés par la migration 2026_04_18 + 2026_04_19) ──
  is_in_correction_circuit?: boolean  // true = boucle active, acteurs verrouillés
  correction_origin_role?: string | null   // slug du rôle ayant déclenché le rejet
  correction_origin_status?: string | null // statut BD avant le rejet
}

export interface WorkflowAction {
  action: string
  motif?: string
  signature_type?: SignatureType
  chef_division_type?: ChefDivisionType
  resend_to?: string
  comment?: string
}

export const STATUS_LABELS: Record<DocumentRequestStatus, string> = {
  submitted:                    'Nouvelle demande',
  secretary_correction:         'Correction secrétaire',
  accounting_review:            'Comptabilité',
  division_manager_review:      'Responsable Division',
  cap_manager_review:           'Chef CAP',
  deputy_director_secretary_review: 'Sec. Dir. Adjointe',
  deputy_director_review:       'Directrice Adjointe',
  director_secretary_review:    'Sec. Directeur',
  director_review:              'Directeur',
  ready_for_pickup:             'Prêt à retirer',
  picked_up:                    'Retiré',
  rejected:                     'Rejeté définitivement',
}

export const STATUS_COLORS: Record<DocumentRequestStatus, string> = {
  submitted:                    'warning',
  secretary_correction:         'danger',
  accounting_review:            'primary',
  division_manager_review:      'primary',
  cap_manager_review:           'primary',
  deputy_director_secretary_review: 'primary',
  deputy_director_review:       'primary',
  director_secretary_review:    'primary',
  director_review:              'primary',
  ready_for_pickup:             'success',
  picked_up:                    'secondary',
  rejected:                     'dark',
}

export const TYPE_LABELS: Record<DocumentRequestType, string> = {
  attestation_passage:     'Attestation de Passage',
  attestation_definitive:  'Attestation Définitive',
  attestation_inscription: "Attestation d'Inscription",
  bulletin_notes:          'Bulletin de Notes',
  bulletin_annuel:         'Bulletin annuel',
}

export const CHEF_DIVISION_LABELS: Record<ChefDivisionType, string> = {
  formation_distance: 'Formation à Distance',
  formation_continue: 'Formation Continue',
}

export const WORKFLOW_STEPS: { status: DocumentRequestStatus; label: string }[] = [
  { status: 'submitted',                  label: 'Soumis'         },
  { status: 'accounting_review',          label: 'Comptabilité'   },
  { status: 'division_manager_review',    label: 'Resp. Division' },
  { status: 'cap_manager_review',         label: 'Chef CAP'       },
  { status: 'deputy_director_secretary_review', label: 'Sec. Dir. Adj.' },
  { status: 'deputy_director_review',     label: 'Dir. Adjointe'  },
  { status: 'director_secretary_review',  label: 'Sec. Directeur' },
  { status: 'director_review',            label: 'Directeur'      },
  { status: 'ready_for_pickup',           label: 'Prêt'           },
  { status: 'picked_up',                  label: 'Remis'          },
]

// ─── Options de renvoi depuis secretary_correction ───────────────────────────
// IMPORTANT : les valeurs utilisent des TIRETS (pas des underscores).
// Le backend WorkflowConstants::ACTION_MATRIX attend exactement ces slugs :
//   'comptable', 'chef-division', 'chef-cap', 'sec-da',
//   'directrice-adjointe', 'sec-dir', 'directeur'
// La valeur spéciale 'origin' déclenche la sortie du circuit de correction.

export const RESEND_OPTIONS: { value: string; label: string }[] = [
  { value: 'comptable',           label: 'Comptable'            },
  { value: 'chef-division',       label: 'Responsable Division' },
  { value: 'chef-cap',            label: 'Chef CAP'             },
  { value: 'sec-da',              label: 'Sec. Dir. Adjointe'   },
  { value: 'directrice-adjointe', label: 'Directrice Adjointe'  },
  { value: 'sec-dir',             label: 'Sec. Directeur'       },
  { value: 'directeur',           label: 'Directeur'            },
]

// Label lisible pour un correction_origin_role
export const ROLE_LABELS: Record<string, string> = {
  'comptable':           'Comptable',
  'chef-division':       'Responsable Division',
  'chef-cap':            'Chef CAP',
  'sec-da':              'Sec. Dir. Adjointe',
  'directrice-adjointe': 'Directrice Adjointe',
  'sec-dir':             'Sec. Directeur',
  'directeur':           'Directeur',
}
