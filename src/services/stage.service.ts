// src/services/stage.service.ts
// Module Stages (Lot 1) - Responsable de division (formation continue) et admin.

import HttpService from './http.service'
import { localFileFrom, saveLocalFile, type LocalFile } from '@/utils/base64File'
import type { ChunkLoader } from '@/components/document-request/progressiveFile'

const BASE = 'stages/admin'

export type StageStatus =
  | 'submitted' | 'proposal_sent' | 'counter_proposed' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'
  | 'desiste' | 'desiste_constate' | 'revoque'

export interface StageHoraires { arrivee: string; pause_debut: string; pause_fin: string; sortie: string }

export interface StageTerms {
  service: string
  lieu: string
  date_debut: string
  date_fin: string
  horaires: StageHoraires
}

export interface StageListRow {
  id: number
  reference: string
  status: StageStatus
  status_label: string
  nom_complet: string
  etablissement: string
  formation: string
  date_debut_souhaitee: string | null
  duree_souhaitee: string
  date_debut: string | null
  date_fin: string | null
  created_at: string
  updated_at: string
}

export interface StageExchange {
  id: number
  author: 'staff' | 'demandeur'
  author_name: string | null
  kind: 'proposal' | 'counter' | 'accept'
  service: string | null
  lieu: string | null
  date_debut: string | null
  date_fin: string | null
  horaires: StageHoraires | null
  message: string | null
  at: string
}

export type StageNoteKind = 'initiale' | 'rectificative' | 'desistement' | 'revocation'

export type RevokeMotif = 'absences' | 'reglement' | 'autre'

export interface StageEndState {
  can_end: boolean
  can_undo: boolean
  motifs: Record<RevokeMotif, string>
  current: {
    type: 'desiste' | 'desiste_constate' | 'revoque'
    type_label: string
    motif_type: RevokeMotif | null
    motif: string | null
    last_day: string | null
    at: string
    undo_until: string
    note_id: number | null
  } | null
}

// ── Messagerie de stage (texte, éphémère) ───────────────────────────────
export interface ChatChannel {
  key: string
  kind: 'group' | 'general'
  title: string
  subtitle: string
  last: { body: string; at: string; who: string } | null
  unread: number
}
export interface ChatFile { id: number; name: string; mime: string; size: number; image: boolean }
export interface ChatMessage {
  id: number
  body: string
  at: string
  mine: boolean
  /** Modifié par son auteur après l'envoi. */
  edited?: boolean
  sender: { key: string; name: string; role: string | null }
  files: ChatFile[]
  /** Message cité ; « deleted » s'il a été effacé (7 jours). */
  reply: { id: number; name?: string; body?: string; deleted?: boolean } | null
}
export interface ChatSeen { id: number; by: { key: string; name: string; at: string | null }[] }
export interface ChatThread {
  channel: Omit<ChatChannel, 'last' | 'unread'>
  messages: ChatMessage[]
  first_unread_id: number | null
  has_more: boolean
  seen: ChatSeen | null
  keep_days: number
  /** Actualisation : messages déjà affichés, modifiés récemment. */
  edits?: { id: number; body: string }[]
}

export interface StageDetail extends StageListRow {
  civilite: string
  nom: string
  prenoms: string
  date_naissance: string
  lieu_naissance: string
  nationalite: string
  theme_souhaite: string | null
  email: string
  whatsapp: string
  files: { key: string; label: string; ext: string }[]
  terms: StageTerms | null
  rejection_reason: string | null
  date_debut_reelle: string | null
  activated_at: string | null
  activation_sent_at: string | null
  proposal_sent_at: string | null
  proposal_expires_at: string | null
  exchanges: StageExchange[]
  notes: { id: number; number: string; kind: StageNoteKind; version: number; motif: string | null; issued_by: string | null; issued_at: string; has_pdf: boolean; cancelled_at: string | null }[]
  history: { id: number; action: string; from_status: string | null; to_status: string | null; actor: 'staff' | 'demandeur' | 'systeme'; user_name: string | null; comment: string | null; meta: any; at: string }[]
  suggested_terms: StageTerms | null
  default_rejection_reason: string
  can: { propose: boolean; reject: boolean; accept_counter: boolean; rectify: boolean }
  /** Fin anticipée : désistement constaté, révocation, annulation (48 h). */
  fin: StageEndState
  /** Stagiaire (demande acceptée) : encadrement, assiduité, rapports, codes d'attention. */
  suivi: FollowRow | null
  me: InternViewer
  /** Demande en binôme : l'autre demande, décidée en même temps. */
  pair: { team_id: number; reference: string; nom_complet: string; status: StageStatus; status_label: string } | null
}

export interface StageSettings {
  requests_open: boolean
  wa_group_auto: boolean
  closed_message: string
  default_rejection_reason: string
  default_service: string
  default_lieu: string
  default_horaires: StageHoraires
  proposal_reminder_days: number
  proposal_expiry_days: number
  lieu_position: { lat: number; lng: number } | null
  lieu_rayon: number
  reglement_text: string
  reglement_version: number
  permission_delay_days: number
  report_frequency: 'journalier' | 'hebdomadaire' | 'mensuel'
  report_grace_days: number
  final_report_open_days: number
  final_correction_days?: number
  seuil_assiduite: number
  attestation_structure: string
  numero_suffixe: string
  note_numero_suffixe: string
  pdf_ville: string
  signataire_titre: string
  signataire_nom: string
  pdf_pied_de_page: string
  /** Notes de service : signature numérique du RD / FC-P */
  note_signataire_titre: string
  note_signataire_nom: string
  note_signature: { width: number; height: number; updated_at: string } | null
}

// ── Attestations (lot 5) ───────────────────────────────────────────────────

export type AttestationStatus = 'a_valider' | 'a_imprimer' | 'imprimee' | 'remise' | 'annulee'

export interface AttestationEligibility {
  taux: number | null
  seuil: number
  attendance_ok: boolean
  /** false : stagiaire invité au stage déjà terminé, seul le rapport final compte */
  attendance_required?: boolean
  final_validated: boolean
  eligible: boolean
  jours_ouvres: number
  absences: number
  missing: string[]
  computed_at: string
}

export interface AttestationContent {
  civilite: string; nom: string; prenoms: string; nom_complet: string
  date_naissance: string | null; lieu_naissance: string; nationalite: string
  etablissement: string; filiere: string; service: string | null; lieu: string | null
  date_debut: string | null; date_fin: string | null; duree: string | null
  theme: string | null
  pays_naissance: string | null; type_stage: string; structure: string
}

/** Attestation de service fait (invitation sans compte, vérification, impression, intéressé prévenu, remise). */
export type WorkAttestationStatus = 'invitee' | 'a_valider' | 'a_imprimer' | 'imprimee' | 'prete' | 'remise' | 'annulee'
export interface WorkAttestationValues {
  civilite: 'M.' | 'Mme' | 'Mlle' | null
  nom: string | null
  prenoms: string | null
  email: string | null
  phone: string | null
  diplome: string | null
  nature: string | null
  fonctions: string[]
  taches: string[]
  date_debut: string | null
  date_fin: string | null
  appreciation: string | null
}
export interface WorkAttestation {
  id: number
  status: WorkAttestationStatus
  status_label: string
  nom_complet: string | null
  phone: string | null
  numero: string | null
  date_debut: string | null
  date_fin: string | null
  stage: { id: number; reference: string | null } | null
  expires_at: string | null
  notified_at: string | null
  delivered_on: string | null
  updated_at: string | null
  // Détail
  values?: WorkAttestationValues
  missing?: string[]
  document_date?: string | null
  default_document_date?: string
  next_number?: string | null
  send_count?: number
  last_sent_at?: string | null
  submitted_at?: string | null
  notify_count?: number
  created_by?: string | null
  validated_by?: string | null
  validated_at?: string | null
  printed_by?: string | null
  printed_at?: string | null
  notified_by?: string | null
  delivered_by?: string | null
  cancelled_by?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
  natures?: string[]
  limits?: { fonctions: number; taches: number; fonction: number; tache: number; total: number }
}

export interface Attestation {
  id: number
  kind: 'normale' | 'exceptionnelle' | 'demande'
  kind_label: string
  status: AttestationStatus
  status_label: string
  numero: string | null
  document_date: string | null
  /** Date proposée par défaut (fin de stage déclarée pour un stagiaire arrivé avant le système) */
  default_document_date?: string
  motif_type: string | null
  motif_type_label: string | null
  motif: string | null
  created_at: string
  updated_at: string
  validated_at: string | null
  validated_by: string | null
  printed_at: string | null
  printed_by: string | null
  delivered_on: string | null
  delivered_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  has_scan: boolean
  stage: { id: number; reference: string; nom_complet: string; date_fin: string | null; whatsapp: string } | null
  content?: AttestationContent
  overrides?: { pays_naissance?: string; type_stage?: string; structure?: string }
  eligibility?: AttestationEligibility | null
}

// ── Tableau de bord et suivi (lot 6) ───────────────────────────────────────

export interface FollowRow extends Intern {
  activated: boolean
  date_debut_reelle: string | null
  fin_proche: boolean
  taux: number | null
  jours_ouvres: number
  absences: number
  retards: number
  sorties_anticipees: number
  justifies: number
  rapports: { deposited: number; validated: number; missing: number; final_validated: boolean }
  attestation: { id: number; status: AttestationStatus; label: string; numero: string | null } | null
  codes: AttentionCode[]
}

export type AttentionCodeKey = 'non_active' | 'assiduite' | 'fin_proche' | 'rapports' | 'sans_superviseur'
export interface AttentionCode { code: AttentionCodeKey; detail: string }

export interface FollowResponse {
  data: FollowRow[]
  counts: Record<InternScope, number>
  me: InternViewer
  seuil: number
}

/** Une ligne par stagiaire, ses codes du plus urgent au moins urgent. */
export interface DashboardAlert {
  stage_id: number
  reference: string
  nom: string
  codes: AttentionCode[]
}

export interface StagesDashboard {
  lead: boolean
  today: string
  seuil: number
  requests_open: boolean
  demandes: { a_traiter: number; proposition: number; acceptees: number; non_retenues: number }
  stagiaires: { en_cours: number; a_venir: number; fin_proche: number; termines_annee: number; sans_superviseur: number | null }
  a_faire: { rapports: number; demandes_stagiaires: number; attestations: number | null }
  assiduite: { moyenne: number | null; sous_seuil: number; mesures: number }
  alertes: DashboardAlert[]
  alertes_total: number
  mensuel: { mois: string; recues: number; acceptees: number }[]
}

export interface StageAttestationOverview {
  prepare_day: string | null
  eligibility: AttestationEligibility
  items: Attestation[]
  has_open: boolean
}

export interface ReportSummary {
  id: number
  kind: 'periodique' | 'final'
  period_key: string
  label: string
  status: 'submitted' | 'supervisor_approved' | 'supervisor_rejected' | 'approved' | 'rejected'
  status_label: string
  validated: boolean
  locked: boolean
  current_version: number
  /** Version validée qui fait foi */
  official_version?: number | null
  /** Version corrigée après soutenance (le rapport reste validé) */
  correction_status?: 'pending' | 'approved' | 'rejected' | null
  late: boolean
  submitted_at: string | null
  stage?: { id: number; reference: string; nom_complet: string } | null
  /** Rapport commun du binôme : il vaut aussi pour ce stagiaire. */
  binome?: { report_id: number; name: string; deposited_by: string | null } | null
}

export type TaskStatus = 'todo' | 'submitted' | 'revision' | 'validated'
export interface TaskSummary {
  id: number
  title: string
  due_date: string | null
  /** Heure d'échéance (HH:MM). */
  due_time: string | null
  status: TaskStatus
  status_label: string
  version: number
  submitted_at: string | null
  published: boolean
  published_at: string | null
  created_by: { type: 'staff' | 'intern'; name: string; id?: number }
  members: { id: number; name: string }[]
  items_count: number
}
export interface TaskItem { id: number; kind: 'file' | 'link'; name: string; url: string | null; mime: string | null; size: number }
export interface TaskDetail extends TaskSummary {
  instructions: string | null
  message: string | null
  review_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  items: TaskItem[]
  can_delete: boolean
  can_review: boolean
  can_publish: boolean
  /** Invités : stagiaires (pour voir ou y travailler) et personnel (pour voir ou avec plein pouvoir). */
  invited: TaskInvite[]
  can_invite: boolean
  /** Peut faire compter le travail pour un invité et accorder le plein pouvoir. */
  can_grant: boolean
}
export type TaskInvite =
  | { type: 'intern'; id: number; name: string; role: 'worker' | 'viewer'; counts: boolean; invited_by: string | null }
  | { type: 'staff'; id: number; name: string; full_power: boolean; invited_by: string | null }
/** Stagiaire en cours, pour confier une tâche (binome : nom du binôme ; mine : suivi par moi). */
export interface TaskIntern { id: number; name: string; binome: string | null; mine: boolean }
/** Personnes qu'on peut inviter sur une tâche. */
export interface TaskInvitables { interns: { id: number; name: string; mine: boolean }[]; staff: { id: number; name: string }[] }

export interface ReportDetail extends ReportSummary {
  /** by : binôme qui a déposé la version (rapport commun). */
  versions: { version: number; name: string; size: number; note: string | null; late: boolean; post_defense?: boolean; at: string; by?: string | null }[]
  comments: { id: number; version: number | null; author: 'staff' | 'stagiaire'; name: string; body: string; at: string; can_delete?: boolean }[]
  reviews: { id: number; version: number; role: 'superviseur' | 'responsable'; decision: 'approved' | 'rejected'; comment: string | null; name: string; at: string }[]
}

export interface ReportPeriod {
  key: string
  kind: 'periodique' | 'final'
  label: string
  opens: string | null
  closes: string | null
  state: 'upcoming' | 'open' | 'missing' | 'deposited' | 'validated' | 'to_fix'
  report: ReportSummary | null
}

export interface ReportsOverview {
  frequency: string
  items: ReportPeriod[]
  final: ReportPeriod | null
  stats: { expected: number; deposited: number; validated: number; missing: number; final_validated: boolean }
}

export interface AttendanceSummary {
  jours_ouvres: number; presents: number; demi_journees: number; absences: number; justifies: number
  /** Retards (arrivée, retour de pause) et sorties anticipées : comptés, minutes comptées, couverts par une permission. */
  retards: number; minutes_retard: number; retards_justifies: number
  sorties_anticipees: number; minutes_sortie_anticipee: number; sorties_justifiees: number
  heures_dues: number; heures_presence: number
  taux: number | null
}

export interface AttendanceGap { minutes: number; justified: boolean }

export interface InternPresence {
  account: {
    activated_at: string | null
    last_login_at: string | null
    reglement_accepted_at: string | null
    reglement_version: number | null
    /** mode « code » : téléphone sans empreinte, pointage avec un code reçu sur WhatsApp. */
    devices: { id: number; device_label: string | null; created_at: string; last_used_at: string | null; revoked_at: string | null; mode: 'empreinte' | 'code' }[]
  } | null
  /** Période manquée avant la prise de service (jours à régulariser) et dernière régularisation. */
  regularisation: { days: string[]; done: string | null }
  activation: { sent_at: string | null; reminders: number }
  date_debut_reelle: string | null
  shift: { planned: string; real: string; suggested_end: string; applied: boolean } | null
  summary: AttendanceSummary
  seuil?: number
  days: {
    day: string
    status: 'present' | 'half' | 'absent' | 'justified' | 'in_progress'
    justification: string | null
    justification_label: string | null
    retards: (AttendanceGap & { pointage: 'arrivee' | 'pause_fin' })[]
    sortie_anticipee: AttendanceGap | null
    /** Permissions d'une partie de journée accordées ce jour (retard, sortie_anticipee). */
    permissions: string[]
    minutes_dues: number
    minutes_presence: number
    punches: Record<string, { at: string; late_minutes: number; early: boolean; distance_m: number | null; code?: boolean } | null>
    /** Journée de la période manquée, marquée présente par le personnel. */
    regularise?: boolean
  }[]
  failures: Record<string, number>
}

export interface InternRequestRow {
  id: number
  kind: 'permission' | 'prolongation' | 'raccourcissement'
  kind_label: string
  type: string | null
  type_label: string | null
  date_from: string | null
  date_to: string | null
  time_from: string | null
  time_to: string | null
  new_date_fin: string | null
  motif: string
  has_file: boolean
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  decision_comment: string | null
  decided_at: string | null
  created_at: string
  stage: { id: number; reference: string; nom_complet: string; date_fin: string }
}

export interface StageListResponse {
  data: StageListRow[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
  counts: Record<StageStatus, number>
  labels: Record<StageStatus, string>
}

export type InternScope = 'active' | 'current' | 'upcoming' | 'finished' | 'all' | 'mine' | 'unsupervised'

export interface Intern {
  id: number
  reference: string
  nom_complet: string
  whatsapp: string
  email: string
  formation: string
  etablissement: string
  service: string | null
  date_debut: string
  date_fin: string
  phase: 'current' | 'upcoming' | 'finished'
  team: { id: number; name: string | null; final_mode?: FinalMode } | null
  supervisors: { id: number; name: string }[]
  supervised_by_me: boolean
  whatsapp_group: 'added' | 'invited' | 'removed' | null
}

export interface InternViewer { id: number; is_lead: boolean; is_supervisor: boolean }


export interface Supervisor { id: number; name: string; email: string; phone: string | null; since: string; active_interns: number }

export interface InternInvitation {
  id: number
  phone: string
  status: 'pending' | 'used' | 'expired' | 'revoked'
  expires_at: string
  last_sent_at: string | null
  send_count: number
  used_at: string | null
  stage_request_id: number | null
  reference: string | null
  intern_name: string | null
  invited_by_name: string | null
  created_at: string
  /** Invitation en binôme : l'invitation de l'autre stagiaire */
  pair_id?: number | null
  final_mode?: FinalMode | null
}

export interface SupervisorInvitation {
  id: number
  phone: string
  name: string | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  last_sent_at: string | null
  send_count: number
  accepted_at: string | null
  invited_by_name: string | null
  accepted_name: string | null
  created_at: string
}

/** Rapport final d'un binôme : chacun le sien, ou un même mémoire déposé une fois pour les deux. */
export type FinalMode = 'individuel' | 'commun'

/** Stagiaire d'un binôme, ou libre pour en former un (« termine » : stage fini). */
export interface BinomeMember { id: number; reference: string; nom_complet: string; etablissement: string; date_debut: string; date_fin: string; termine?: boolean }
export interface StageTeam {
  id: number; name: string; members: BinomeMember[]; created_at: string
  /** responsable : formé dans le progiciel ; stagiaires : choisi depuis leur espace ; demande : demande de stage en binôme */
  origin: 'responsable' | 'stagiaires' | 'demande'
  final_mode: FinalMode
  /** un rapport final est déjà déposé : le mode ne change plus */
  final_locked: boolean
}
export interface BinomeInvite {
  id: number; from: BinomeMember; to: BinomeMember; phase: 'stage' | 'demande'; created_at: string; expires_at: string
}
export interface BinomesOverview { teams: StageTeam[]; requests: StageTeam[]; invites: BinomeInvite[]; candidates: BinomeMember[] }

export interface WhatsAppGroupOverview {
  year: number
  /** Création automatique du groupe au premier stagiaire de l'année. */
  auto: boolean
  group: { id: number; name: string; origin: 'created' | 'linked'; created_at: string; members: number; supervisors: number } | null
  waiting: number
  history: { id: number; year: number; name: string; origin: string; created_at: string; dissolved_at: string | null }[]
}

class StageService {
  list = (params: { status?: string; q?: string; page?: number } = {}): Promise<StageListResponse> => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.append(k, String(v)) })
    return HttpService.get(`${BASE}/demandes${qs.toString() ? `?${qs}` : ''}`)
  }

  get = async (idOrRef: number | string): Promise<StageDetail> =>
    (await HttpService.get(`${BASE}/demandes/${encodeURIComponent(String(idOrRef))}`)).data

  propose = (id: number, terms: StageTerms, message?: string) =>
    HttpService.post(`${BASE}/demandes/${id}/proposition`, { ...terms, message: message || null })

  acceptCounter = (id: number) =>
    HttpService.post(`${BASE}/demandes/${id}/accepter-contre-proposition`)

  reject = (id: number, motif: string) =>
    HttpService.post(`${BASE}/demandes/${id}/rejet`, { motif })

  rectify = (id: number, terms: StageTerms, motif: string) =>
    HttpService.post(`${BASE}/demandes/${id}/rectification`, { ...terms, motif })

  getSettings = async (): Promise<StageSettings> => (await HttpService.get(`${BASE}/reglages`)).data

  updateSettings = async (values: Partial<StageSettings>): Promise<StageSettings> =>
    (await HttpService.put(`${BASE}/reglages`, values)).data

  /** Signature des notes de service : fond retiré et marges coupées par le serveur. */
  uploadNoteSignature = async (file: File): Promise<StageSettings> => {
    const fd = new FormData()
    fd.append('image', file)
    return (await HttpService.post(`${BASE}/reglages/signature`, fd)).data
  }

  deleteNoteSignature = async (): Promise<StageSettings> => (await HttpService.delete(`${BASE}/reglages/signature`)).data

  noteSignatureImage = async (): Promise<LocalFile> =>
    localFileFrom(await HttpService.get(`${BASE}/reglages/signature`), 'signature.png')

  // ── Stagiaires, superviseurs, binômes, groupe WhatsApp (lot 2) ─────────

  setSupervisor = (stageIds: number[], supervisorId: number, action: 'add' | 'remove') =>
    HttpService.post(`${BASE}/stagiaires/superviseur`, { stage_ids: stageIds, supervisor_id: supervisorId, action })

  supervisors = async (): Promise<Supervisor[]> => (await HttpService.get(`${BASE}/superviseurs`)).data

  // Stagiaires arrivés avant le système (invitation par numéro WhatsApp)
  internInvitations = async (): Promise<InternInvitation[]> => (await HttpService.get(`${BASE}/invitations-stagiaires`)).data
  /** binome : deux numéros invités ensemble (rapport final individuel ou commun). */
  inviteInterns = (numeros: string, binome?: { final_mode: FinalMode }) =>
    HttpService.post(`${BASE}/invitations-stagiaires`, binome ? { numeros, binome: true, rapport_final: binome.final_mode } : { numeros })
  resendInternInvitation = (id: number) => HttpService.post(`${BASE}/invitations-stagiaires/${id}/renvoyer`)
  revokeInternInvitation = (id: number) => HttpService.delete(`${BASE}/invitations-stagiaires/${id}`)

  invitations = async (): Promise<SupervisorInvitation[]> => (await HttpService.get(`${BASE}/invitations`)).data

  invite = (numeros: string, nom?: string) => HttpService.post(`${BASE}/invitations`, { numeros, nom: nom || null })

  resendInvitation = (id: number) => HttpService.post(`${BASE}/invitations/${id}/renvoyer`)

  revokeInvitation = (id: number) => HttpService.delete(`${BASE}/invitations/${id}`)

  /** Binômes formés et stagiaires encore libres (en cours, à venir, ou terminés sans rapport final validé). */
  binomes = async (): Promise<BinomesOverview> => (await HttpService.get(`${BASE}/equipes`)).data

  /** Toujours deux stagiaires ; nom facultatif (sinon « Binôme NOM / NOM »). */
  formBinome = (stageIds: [number, number], nom?: string, finalMode: FinalMode = 'individuel') =>
    HttpService.post(`${BASE}/equipes`, { stage_ids: stageIds, nom: nom?.trim() || null, final_mode: finalMode })

  /** Rapport final du binôme : individuel ou commun (tant qu'aucun n'est déposé). */
  setBinomeFinalMode = (id: number, finalMode: FinalMode) =>
    HttpService.patch(`${BASE}/equipes/${id}/rapport-final`, { final_mode: finalMode })

  dissolveBinome = (id: number) => HttpService.delete(`${BASE}/equipes/${id}`)

  whatsappGroup = async (): Promise<WhatsAppGroupOverview> => (await HttpService.get(`${BASE}/groupe-whatsapp`)).data

  createWhatsappGroup = () => HttpService.post(`${BASE}/groupe-whatsapp/creer`)

  linkWhatsappGroup = (lien: string) => HttpService.post(`${BASE}/groupe-whatsapp/lier`, { lien })

  syncWhatsappGroup = () => HttpService.post(`${BASE}/groupe-whatsapp/synchroniser`)

  dissolveWhatsappGroup = (id: number) => HttpService.post(`${BASE}/groupe-whatsapp/${id}/dissoudre`)

  // ── Assiduité et demandes des stagiaires (lot 3) ───────────────────────

  presence = async (id: number): Promise<InternPresence> => (await HttpService.get(`${BASE}/stagiaires/${id}/presence`)).data

  resetDevice = (id: number) => HttpService.post(`${BASE}/stagiaires/${id}/appareil/reinitialiser`)
  /** present : jours de la période manquée où le stagiaire était là ; les autres sont des absences. */
  regularize = (id: number, present: string[]) => HttpService.post(`${BASE}/stagiaires/${id}/presence/regulariser`, { present })

  internRequests = (status: string, mine: boolean): Promise<{ data: InternRequestRow[]; pending: number }> =>
    HttpService.get(`${BASE}/demandes-stagiaires?status=${status}${mine ? '&mine=1' : ''}`)

  decideInternRequest = (id: number, decision: 'approved' | 'rejected', comment?: string) =>
    HttpService.post(`${BASE}/demandes-stagiaires/${id}/decision`, { decision, comment: comment || null })

  internRequestFile = async (id: number): Promise<LocalFile> =>
    localFileFrom(await HttpService.get(`${BASE}/demandes-stagiaires/${id}/piece`), 'justificatif')

  // ── Rapports (lot 4) ───────────────────────────────────────────────────

  reports = (status: string, mine: boolean): Promise<{ data: ReportSummary[]; to_review: number }> =>
    HttpService.get(`${BASE}/rapports?status=${status}${mine ? '&mine=1' : ''}`)

  report = async (id: number): Promise<ReportDetail> => (await HttpService.get(`${BASE}/rapports/${id}`)).data

  internReports = async (stageId: number): Promise<ReportsOverview> => (await HttpService.get(`${BASE}/stagiaires/${stageId}/rapports`)).data

  commentReport = (id: number, body: string) => HttpService.post(`${BASE}/rapports/${id}/commentaires`, { body })

  deleteReportComment = (id: number, commentId: number) => HttpService.delete(`${BASE}/rapports/${id}/commentaires/${commentId}`)

  decideReport = (id: number, decision: 'approved' | 'rejected', comment?: string) =>
    HttpService.post(`${BASE}/rapports/${id}/decision`, { decision, comment: comment || null })

  /** Version d'un rapport, par tranches (affichage progressif). */
  reportChunks = (id: number, version: number): ChunkLoader => (from, size) =>
    HttpService.get(`${BASE}/rapports/${id}/versions/${version}?from=${from}&size=${size}`)

  // ── Tâches ─────────────────────────────────────────────────────────────

  tasks = (status: string, mine: boolean): Promise<{ data: { tasks: TaskSummary[]; interns: TaskIntern[] } }> =>
    HttpService.get(`${BASE}/taches?status=${status}${mine ? '&mine=1' : ''}`)

  tasksPublished = async (): Promise<TaskSummary[]> => (await HttpService.get(`${BASE}/taches/publies`)).data

  task = async (id: number): Promise<TaskDetail> => (await HttpService.get(`${BASE}/taches/${id}`)).data

  createTask = (t: { stage_request_id: number; title: string; instructions?: string; due_date?: string; due_time?: string; pour_binome?: boolean }) =>
    HttpService.post(`${BASE}/taches`, t)

  deleteTask = (id: number) => HttpService.delete(`${BASE}/taches/${id}`)

  decideTask = (id: number, decision: 'validated' | 'revision', comment?: string) =>
    HttpService.post(`${BASE}/taches/${id}/decision`, { decision, comment: comment || null })

  publishTask = (id: number, isPublic: boolean) => HttpService.post(`${BASE}/taches/${id}/publication`, { public: isPublic })
  taskInvitables = async (): Promise<TaskInvitables> => (await HttpService.get(`${BASE}/taches/invitables`)).data
  inviteTask = (id: number, who: { type: 'intern' | 'staff'; id: number; role?: 'worker' | 'viewer'; counts?: boolean; full_power?: boolean }) =>
    HttpService.post(`${BASE}/taches/${id}/invitations`, who)
  uninviteTask = (id: number, type: 'intern' | 'staff', who: number) => HttpService.delete(`${BASE}/taches/${id}/invitations/${type}/${who}`)

  /** Fichier rendu, par tranches (affichage progressif). */
  taskChunks = (id: number, item: number): ChunkLoader => (from, size) =>
    HttpService.get(`${BASE}/taches/${id}/fichiers/${item}?from=${from}&size=${size}`)

  // ── Attestations (lot 5) ───────────────────────────────────────────────

  attestations = (status: string): Promise<{ data: Attestation[]; counts: Partial<Record<AttestationStatus, number>>; lead: boolean }> =>
    HttpService.get(`${BASE}/attestations?status=${encodeURIComponent(status)}`)

  attestation = async (id: number): Promise<Attestation> => (await HttpService.get(`${BASE}/attestations/${id}`)).data

  stageAttestation = async (stageId: number): Promise<StageAttestationOverview> =>
    (await HttpService.get(`${BASE}/stagiaires/${stageId}/attestation`)).data

  prepareAttestation = (stageId: number) => HttpService.post(`${BASE}/stagiaires/${stageId}/attestation`)

  exceptionalAttestation = (stageId: number, password: string, motif: string) =>
    HttpService.post(`${BASE}/stagiaires/${stageId}/attestation-exceptionnelle`, { password, motif })

  updateAttestation = (id: number, values: { pays_naissance?: string | null; type_stage?: string | null; structure?: string | null }) =>
    HttpService.put(`${BASE}/attestations/${id}`, values)

  validateAttestation = (id: number) => HttpService.post(`${BASE}/attestations/${id}/valider`)

  cancelAttestation = (id: number, motif: string) => HttpService.post(`${BASE}/attestations/${id}/annuler`, { motif })

  /** Numéro (écrit à la main, facultatif, pour le registre) et date portée sur l'attestation. */
  printedAttestation = (id: number, numero: string, date: string) =>
    HttpService.post(`${BASE}/attestations/${id}/imprimee`, { numero: numero || null, date })

  deliveredAttestation = (id: number, date: string) => HttpService.post(`${BASE}/attestations/${id}/remise`, { date })

  /** Prévenir à nouveau le stagiaire : son attestation imprimée l'attend au secrétariat. */
  notifyAttestation = (id: number) => HttpService.post(`${BASE}/attestations/${id}/prevenir`, {})

  // ── Attestations de service fait ────────────────────────────────────────────

  workAttestations = (status: string, q = ''): Promise<{ data: WorkAttestation[]; counts: Partial<Record<WorkAttestationStatus, number>> }> =>
    HttpService.get(`${BASE}/attestations-travail?status=${encodeURIComponent(status)}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`)
  workAttestation = async (id: number): Promise<WorkAttestation> => (await HttpService.get(`${BASE}/attestations-travail/${id}`)).data
  /** Attestations de service fait d'un ancien stagiaire (dossier). */
  stageWorkAttestations = async (stageId: number): Promise<WorkAttestation[]> => (await HttpService.get(`${BASE}/stagiaires/${stageId}/attestations-travail`)).data
  inviteWorkAttestation = (numero: string) => HttpService.post(`${BASE}/attestations-travail`, { numero })
  /** Dossier d'un ancien stagiaire : lien envoyé, ou fiche remplie par le responsable. */
  workAttestationFromStage = (stageId: number, mode: 'lien' | 'remplir') => HttpService.post(`${BASE}/stagiaires/${stageId}/attestation-travail`, { mode })
  updateWorkAttestation = (id: number, values: Partial<WorkAttestationValues>) => HttpService.put(`${BASE}/attestations-travail/${id}`, values)
  validateWorkAttestation = (id: number) => HttpService.post(`${BASE}/attestations-travail/${id}/valider`, {})
  resendWorkAttestation = (id: number) => HttpService.post(`${BASE}/attestations-travail/${id}/renvoyer`, {})
  cancelWorkAttestation = (id: number, motif: string) => HttpService.post(`${BASE}/attestations-travail/${id}/annuler`, { motif })
  printedWorkAttestation = (id: number, numero: string, date: string) =>
    HttpService.post(`${BASE}/attestations-travail/${id}/imprimee`, { numero: numero || null, date })
  notifyWorkAttestation = (id: number) => HttpService.post(`${BASE}/attestations-travail/${id}/prevenir`, {})
  deliveredWorkAttestation = (id: number, date: string) => HttpService.post(`${BASE}/attestations-travail/${id}/remise`, { date })

  uploadAttestationScan = (id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return HttpService.post(`${BASE}/attestations/${id}/scan`, fd)
  }

  private pdfFrom = (res: any, fallbackName: string) => localFileFrom(res, fallbackName, 'application/pdf')

  attestationPdf = async (id: number, date?: string): Promise<LocalFile> =>
    this.pdfFrom(await HttpService.get(`${BASE}/attestations/${id}/pdf${date ? `?date=${encodeURIComponent(date)}` : ''}`), 'attestation.pdf')

  workAttestationPdf = async (id: number, date?: string): Promise<LocalFile> =>
    this.pdfFrom(await HttpService.get(`${BASE}/attestations-travail/${id}/pdf${date ? `?date=${encodeURIComponent(date)}` : ''}`), 'attestation-de-travail.pdf')

  /** Renvoie la note au stagiaire (message puis PDF), responsable seulement. */
  resendNote = (stageId: number, noteId: number) => HttpService.post(`${BASE}/demandes/${stageId}/notes/${noteId}/renvoyer`, {})
  endStage = (stageId: number, body: { type: 'desistement' | 'revocation'; motif_type?: RevokeMotif; motif?: string }) =>
    HttpService.post(`${BASE}/demandes/${stageId}/fin`, body)
  undoEnd = (stageId: number) => HttpService.post(`${BASE}/demandes/${stageId}/fin/annuler`, {})

  /** Stage annulé faute de confirmation de présence : rétabli, nouveau lien envoyé. */
  reinstate = (stageId: number) => HttpService.post(`${BASE}/demandes/${stageId}/retablir`, {})

  chatList = async (): Promise<{ channels: ChatChannel[]; unread: number; keep_days: number }> =>
    (await HttpService.get(`${BASE}/messages`)).data
  chatThread = async (channel: string, q: { after?: number; before?: number } = {}): Promise<ChatThread> => {
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString()
    return (await HttpService.get(`${BASE}/messages/${encodeURIComponent(channel)}${qs ? `?${qs}` : ''}`)).data
  }
  chatSend = (channel: string, msg: { body: string; files: File[]; replyTo?: number }) => {
    const form = new FormData()
    form.append('body', msg.body)
    if (msg.replyTo) form.append('reply_to', String(msg.replyTo))
    msg.files.forEach(f => form.append('files[]', f))
    return HttpService.post(`${BASE}/messages/${encodeURIComponent(channel)}`, form)
  }
  chatEdit = (channel: string, id: number, body: string) =>
    HttpService.patch(`${BASE}/messages/${encodeURIComponent(channel)}/${id}`, { body })
  /** Pièce jointe → adresse locale (blob). */
  chatFile = async (channel: string, fileId: number): Promise<string> =>
    (await HttpService.downloadFile(`${BASE}/messages/${encodeURIComponent(channel)}/fichiers/${fileId}`)).url

  notePdf = async (stageId: number, noteId: number): Promise<LocalFile> =>
    this.pdfFrom(await HttpService.get(`${BASE}/demandes/${stageId}/notes/${noteId}/pdf`), 'note-de-service.pdf')

  attestationScan = async (id: number): Promise<LocalFile> =>
    localFileFrom(await HttpService.get(`${BASE}/attestations/${id}/scan`), 'attestation')

  // ── Tableau de bord, suivi, exports (lot 6) ────────────────────────────

  dashboard = async (): Promise<StagesDashboard> => (await HttpService.get(`${BASE}/tableau-de-bord`)).data

  follow = (scope: InternScope, q = ''): Promise<FollowResponse> =>
    HttpService.get(`${BASE}/suivi?scope=${scope}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`)

  /**
   * Export Excel reçu en JSON (base64) puis enregistré par le navigateur :
   * jamais intercepté par un gestionnaire de téléchargement.
   */
  exportFile = async (path: string): Promise<void> => {
    const { url, name } = localFileFrom(await HttpService.get(`${BASE}/exports/${path}`), 'export.xlsx')
    saveLocalFile(url, name)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  // ── Invitation (page publique) ─────────────────────────────────────────

  invitationInfo = async (token: string): Promise<{ phone: string; name: string | null; expires_at: string }> =>
    (await HttpService.get(`stages/invitation?token=${encodeURIComponent(token)}`)).data

  acceptInvitation = (payload: { token: string; prenom: string; nom: string; email: string; password: string; password_confirmation: string }) =>
    HttpService.post('stages/invitation/accepter', payload)

  /** Pièce d'une demande. */
  /** Pièce d'une demande de stage, par tranches (affichage progressif). */
  fileChunks = (id: number, key: string): ChunkLoader => (from, size) =>
    HttpService.get(`${BASE}/demandes/${id}/pieces/${encodeURIComponent(key)}?format=json&from=${from}&size=${size}`)
}

export default new StageService()
