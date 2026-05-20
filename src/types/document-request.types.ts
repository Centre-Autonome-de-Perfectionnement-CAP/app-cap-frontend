// src/types/document-request.types.ts

export type DocumentRequestStatus =
  | 'pending'
  | 'secretaire_review'
  | 'secretaire_correction'
  | 'comptable_review'
  | 'chef_division_review'
  | 'chef_cap_review'
  | 'sec_dir_adjointe_review'
  | 'directrice_adjointe_review'
  | 'sec_directeur_review'
  | 'directeur_review'
  | 'ready'
  | 'delivered'
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
  pending:                      'Nouvelle demande',
  secretaire_review:            'Secrétariat',
  secretaire_correction:        'Correction secrétaire',
  comptable_review:             'Comptabilité',
  chef_division_review:         'Responsable Division',
  chef_cap_review:              'Chef CAP',
  sec_dir_adjointe_review:      'Sec. Dir. Adjointe',
  directrice_adjointe_review:   'Directrice Adjointe',
  sec_directeur_review:         'Sec. Directeur',
  directeur_review:             'Directeur',
  ready:                        'Prêt à retirer',
  delivered:                    'Retiré',
  rejected:                     'Rejeté définitivement',
}

export const STATUS_COLORS: Record<DocumentRequestStatus, string> = {
  pending:                      'warning',
  secretaire_review:            'info',
  secretaire_correction:        'danger',
  comptable_review:             'primary',
  chef_division_review:         'primary',
  chef_cap_review:              'primary',
  sec_dir_adjointe_review:      'primary',
  directrice_adjointe_review:   'primary',
  sec_directeur_review:         'primary',
  directeur_review:             'primary',
  ready:                        'success',
  delivered:                    'secondary',
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
  { status: 'pending',                    label: 'Soumis'         },
  { status: 'secretaire_review',          label: 'Secrétariat'    },
  { status: 'comptable_review',           label: 'Comptabilité'   },
  { status: 'chef_division_review',       label: 'Resp. Division' },
  { status: 'chef_cap_review',            label: 'Chef CAP'       },
  { status: 'sec_dir_adjointe_review',    label: 'Sec. Dir. Adj.' },
  { status: 'directrice_adjointe_review', label: 'Dir. Adjointe'  },
  { status: 'sec_directeur_review',       label: 'Sec. Directeur' },
  { status: 'directeur_review',           label: 'Directeur'      },
  { status: 'ready',                      label: 'Prêt'           },
  { status: 'delivered',                  label: 'Remis'          },
]

// ─── Options de renvoi depuis secretaire_correction ───────────────────────────
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
