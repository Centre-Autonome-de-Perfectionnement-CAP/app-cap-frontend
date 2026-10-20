// src/services/stage.service.ts
// Module Stages (Lot 1) — Responsable de division (formation continue) et admin.

import HttpService from './http.service'

const BASE = 'stages/admin'

export type StageStatus =
  | 'submitted' | 'proposal_sent' | 'counter_proposed' | 'accepted' | 'rejected' | 'expired'

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
  proposal_sent_at: string | null
  proposal_expires_at: string | null
  exchanges: StageExchange[]
  notes: { id: number; number: string; kind: 'initiale' | 'rectificative'; version: number; motif: string | null; issued_by: string | null; issued_at: string; has_pdf: boolean }[]
  history: { id: number; action: string; from_status: string | null; to_status: string | null; actor: 'staff' | 'demandeur' | 'systeme'; user_name: string | null; comment: string | null; meta: any; at: string }[]
  suggested_terms: StageTerms | null
  default_rejection_reason: string
  can: { propose: boolean; reject: boolean; accept_counter: boolean; rectify: boolean }
}

export interface StageSettings {
  requests_open: boolean
  closed_message: string
  default_rejection_reason: string
  default_service: string
  default_lieu: string
  default_horaires: StageHoraires
  proposal_reminder_days: number
  proposal_expiry_days: number
}

export interface StageListResponse {
  data: StageListRow[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
  counts: Record<StageStatus, number>
  labels: Record<StageStatus, string>
}

export type InternScope = 'current' | 'upcoming' | 'finished' | 'all' | 'mine' | 'unsupervised'

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
  team: { id: number; name: string | null } | null
  supervisors: { id: number; name: string }[]
  supervised_by_me: boolean
  whatsapp_group: 'added' | 'invited' | 'removed' | null
}

export interface InternListResponse {
  data: Intern[]
  counts: Record<InternScope, number>
  me: { id: number; is_lead: boolean; is_supervisor: boolean }
}

export interface Supervisor { id: number; name: string; email: string; phone: string | null; since: string; active_interns: number }

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

export interface StageTeam { id: number; name: string; members: { id: number; reference: string; nom_complet: string }[] }

export interface WhatsAppGroupOverview {
  year: number
  group: { id: number; name: string; origin: 'created' | 'linked'; created_at: string; members: number } | null
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

  // ── Stagiaires, superviseurs, binômes, groupe WhatsApp (lot 2) ─────────

  interns = (scope: InternScope, q?: string): Promise<InternListResponse> => {
    const qs = new URLSearchParams({ scope })
    if (q) qs.append('q', q)
    return HttpService.get(`${BASE}/stagiaires?${qs}`)
  }

  setSupervisor = (stageIds: number[], supervisorId: number, action: 'add' | 'remove') =>
    HttpService.post(`${BASE}/stagiaires/superviseur`, { stage_ids: stageIds, supervisor_id: supervisorId, action })

  supervisors = async (): Promise<Supervisor[]> => (await HttpService.get(`${BASE}/superviseurs`)).data

  invitations = async (): Promise<SupervisorInvitation[]> => (await HttpService.get(`${BASE}/invitations`)).data

  invite = (numeros: string, nom?: string) => HttpService.post(`${BASE}/invitations`, { numeros, nom: nom || null })

  resendInvitation = (id: number) => HttpService.post(`${BASE}/invitations/${id}/renvoyer`)

  revokeInvitation = (id: number) => HttpService.delete(`${BASE}/invitations/${id}`)

  teams = async (): Promise<StageTeam[]> => (await HttpService.get(`${BASE}/equipes`)).data

  saveTeam = (id: number | null, nom: string, stageIds: number[]) =>
    id ? HttpService.put(`${BASE}/equipes/${id}`, { nom, stage_ids: stageIds })
       : HttpService.post(`${BASE}/equipes`, { nom, stage_ids: stageIds })

  deleteTeam = (id: number) => HttpService.delete(`${BASE}/equipes/${id}`)

  whatsappGroup = async (): Promise<WhatsAppGroupOverview> => (await HttpService.get(`${BASE}/groupe-whatsapp`)).data

  createWhatsappGroup = () => HttpService.post(`${BASE}/groupe-whatsapp/creer`)

  linkWhatsappGroup = (lien: string) => HttpService.post(`${BASE}/groupe-whatsapp/lier`, { lien })

  syncWhatsappGroup = () => HttpService.post(`${BASE}/groupe-whatsapp/synchroniser`)

  dissolveWhatsappGroup = (id: number) => HttpService.post(`${BASE}/groupe-whatsapp/${id}/dissoudre`)

  // ── Invitation (page publique) ─────────────────────────────────────────

  invitationInfo = async (token: string): Promise<{ phone: string; name: string | null; expires_at: string }> =>
    (await HttpService.get(`stages/invitation?token=${encodeURIComponent(token)}`)).data

  acceptInvitation = (payload: { token: string; prenom: string; nom: string; email: string; password: string; password_confirmation: string }) =>
    HttpService.post('stages/invitation/accepter', payload)

  /** Pièce reçue en JSON (base64) : jamais interceptée par un gestionnaire de téléchargement. */
  fileContent = async (id: number, key: string): Promise<{ url: string; name: string; mime: string }> => {
    const res: any = await HttpService.get(`${BASE}/demandes/${id}/pieces/${encodeURIComponent(key)}?format=json`)
    if (!res?.content) throw new Error("Ce document n'a pas pu être chargé.")
    const bin = atob(res.content)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const mime = String(res.mime || 'application/octet-stream')
    return { url: URL.createObjectURL(new Blob([bytes], { type: mime })), name: String(res.name || key), mime }
  }
}

export default new StageService()
