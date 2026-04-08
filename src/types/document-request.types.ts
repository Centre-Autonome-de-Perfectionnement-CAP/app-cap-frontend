// src/types/document-request.types.ts
// Statuts conformes à l'enum BD existante (aucun nouveau statut créé)

export type DocumentRequestStatus =
  | 'pending'
  | 'secretaire_review'
  | 'chef_division_review'
  | 'secretaire_correction'      // rejet par n'importe qui → ici
  | 'comptable_review'
  | 'chef_cap_review'
  | 'directeur_adjoint_review'
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
  rejected_by: string | null          // rôle qui a rejeté, ex: 'Responsable Division'
  chef_division_comment: string | null
  secretaire_comment: string | null
  comptable_comment: string | null
  signature_type: SignatureType | null
  department_name: string | null
  chef_division_type: ChefDivisionType | null
  chef_division_reviewed_at: string | null
  comptable_reviewed_at: string | null
  chef_cap_reviewed_at: string | null
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
  pending:                   'Nouvelle demande',
  secretaire_review:         'Secrétariat',
  chef_division_review:      'Responsable Division',
  secretaire_correction:     'Correction secrétaire',
  comptable_review:          'Comptabilité',
  chef_cap_review:           'Chef CAP',
  directeur_adjoint_review:  'Directeur Adjoint',
  directeur_review:          'Directeur',
  ready:                     'Prêt à retirer',
  delivered:                 'Retiré',
  rejected:                  'Rejeté définitivement',
}

export const STATUS_COLORS: Record<DocumentRequestStatus, string> = {
  pending:                   'warning',
  secretaire_review:         'info',
  chef_division_review:      'primary',
  secretaire_correction:     'danger',
  comptable_review:          'primary',
  chef_cap_review:           'primary',
  directeur_adjoint_review:  'primary',
  directeur_review:          'primary',
  ready:                     'success',
  delivered:                 'secondary',
  rejected:                  'dark',
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

export const WORKFLOW_STEPS: { status: DocumentRequestStatus; label: string }[] = [
  { status: 'pending',                  label: 'Soumis' },
  { status: 'secretaire_review',        label: 'Secrétariat' },
  { status: 'chef_division_review',     label: 'Responsable Division' },
  { status: 'comptable_review',         label: 'Comptabilité' },
  { status: 'chef_cap_review',          label: 'Chef CAP' },
  { status: 'directeur_adjoint_review', label: 'Dir. Adjoint' },
  { status: 'directeur_review',         label: 'Directeur' },
  { status: 'ready',                    label: 'Prêt' },
  { status: 'delivered',                label: 'Remis' },
]

// Options de renvoi depuis secretaire_correction (peut envoyer à tout le monde)
export const RESEND_OPTIONS: { value: string; label: string; status: DocumentRequestStatus }[] = [
  { value: 'chef_division',     label: 'Responsable Division',     status: 'chef_division_review' },
  { value: 'comptable',         label: 'Comptable',         status: 'comptable_review' },
  { value: 'chef_cap',          label: 'Chef CAP',          status: 'chef_cap_review' },
  { value: 'directeur_adjoint', label: 'Directeur Adjoint', status: 'directeur_adjoint_review' },
  { value: 'directeur',         label: 'Directeur',         status: 'directeur_review' },
]
