// src/types/document-request.types.ts
// Statuts conformes à l'enum BD — nouveau circuit :
// Secrétaire → Comptable → Resp. Division → Chef CAP →
// Sec. Dir. Adjointe → Dir. Adjointe → Sec. Directeur → Directeur → Secrétaire (clôture)

export type DocumentRequestStatus =
  | 'pending'
  | 'secretaire_review'
  | 'secretaire_correction'
  | 'comptable_review'
  | 'chef_division_review'
  | 'chef_cap_review'
  | 'sec_dir_adjointe_review'      // NOUVEAU — Secrétaire Directrice Adjointe
  | 'directrice_adjointe_review'   // MODIFIÉ  — ex directeur_adjoint_review
  | 'sec_directeur_review'         // NOUVEAU — Secrétaire Directeur
  | 'directeur_review'
  | 'ready'
  | 'delivered'
  | 'rejected'

export type DocumentRequestType =
  | 'attestation_passage'
  | 'attestation_definitive'
  | 'attestation_inscription'
  | 'bulletin_notes'

export type SignatureType = 'paraphe' | 'signature'
export type ChefDivisionType = 'formation_distance' | 'formation_continue'

export interface DocumentRequest {
  id: number
  reference: string
  type: DocumentRequestType
  status: DocumentRequestStatus
  email: string | null
  files: Record<string, string> | null | string
  submitted_at: string
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
}

export interface WorkflowAction {
  action: string
  motif?: string
  signature_type?: SignatureType
  chef_division_type?: ChefDivisionType
  resend_to?: string
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
}

export const CHEF_DIVISION_LABELS: Record<ChefDivisionType, string> = {
  formation_distance: 'Formation à Distance',
  formation_continue: 'Formation Continue',
}

// ─── Étapes de la timeline — dans l'ordre exact du nouveau circuit ─────────────

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

export const RESEND_OPTIONS: { value: string; label: string; status: DocumentRequestStatus }[] = [
  { value: 'comptable',           label: 'Comptable',            status: 'comptable_review'           },
  { value: 'chef_division',       label: 'Responsable Division', status: 'chef_division_review'       },
  { value: 'chef_cap',            label: 'Chef CAP',             status: 'chef_cap_review'            },
  { value: 'sec_dir_adjointe',    label: 'Sec. Dir. Adjointe',   status: 'sec_dir_adjointe_review'    },
  { value: 'directrice_adjointe', label: 'Directrice Adjointe',  status: 'directrice_adjointe_review' },
  { value: 'sec_directeur',       label: 'Sec. Directeur',       status: 'sec_directeur_review'       },
  { value: 'directeur',           label: 'Directeur',            status: 'directeur_review'           },
]
