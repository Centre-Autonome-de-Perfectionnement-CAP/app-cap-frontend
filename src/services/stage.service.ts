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
