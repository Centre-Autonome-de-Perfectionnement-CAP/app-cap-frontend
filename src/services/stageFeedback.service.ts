// src/services/stageFeedback.service.ts
// Documents et références, avis des stagiaires, notation du stage et
// évaluation des stagiaires (note sur 20 des superviseurs).

import HttpService from './http.service'
import { localFileFrom, saveLocalFile } from '@/utils/base64File'

const BASE = 'stages/admin'

export interface StageDocument {
  id: number; title: string; description: string | null; category: string; category_label: string
  kind: 'file' | 'link'; url: string | null; file_name: string | null; size: number | null; by: string | null; created_at: string
}

export interface Feedback {
  id: number; type: string; type_label: string; subject: string; subject_label: string; message: string
  /** null : anonyme */
  author: string | null
  file_name: string | null; new: boolean; public_ok: boolean; published: boolean; can_publish: boolean; can_delete: boolean; created_at: string
}

export interface RatingsBoard {
  count: number
  criteria: { key: string; label: string; average: number | null }[]
  months: { month: string; count: number; average: number }[]
  supervisors: { name: string; count: number; average: number }[]
  comments: { comment: string; period: string; created_at: string }[]
}

export interface EvalCriterion { key: string; label: string; max: number }
export interface EvalToRate {
  id: number; name: string; reference: string; date_fin: string | null
  /** Stagiaire suivi : note obligatoire. */
  mine: boolean
  mine_evaluation: { scores: Record<string, number>; total: number; comment: string; returned_note: string | null } | null
}
export interface EvalBoardItem {
  id: number; name: string; reference: string; date_fin: string | null
  validated: boolean; validated_at: string | null; appreciation: string | null; final: number | null
  preview: { average: number; final: number; criteria: Record<string, number> } | null
  /** Superviseurs titulaires qui n'ont pas encore noté. */
  missing: string[]
  evaluations: { user_id: number; name: string; titular: boolean; scores: Record<string, number>; total: number; comment: string; returned: boolean; returned_note: string | null }[]
}

/** Nombre au format français : 16,5 ; décimales : 2 pour une note retenue. */
export const frNum = (v: number | null | undefined, decimals?: number) =>
  v == null ? '-' : v.toLocaleString('fr-FR', decimals == null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const download = async (path: string, name: string) => {
  const f = localFileFrom(await HttpService.get(path), name)
  saveLocalFile(f.url, f.name)
}

class StageFeedbackService {
  // ── Documents ──
  documents = async (): Promise<{ items: StageDocument[]; categories: Record<string, string> }> => (await HttpService.get(`${BASE}/documents`)).data
  addDocument = (d: { title: string; category: string; description?: string; url?: string; file?: File | null }) => {
    const fd = new FormData()
    fd.append('title', d.title)
    fd.append('category', d.category)
    if (d.description) fd.append('description', d.description)
    if (d.file) fd.append('file', d.file)
    else if (d.url) fd.append('url', d.url)
    return HttpService.post(`${BASE}/documents`, fd)
  }
  deleteDocument = (id: number) => HttpService.delete(`${BASE}/documents/${id}`)
  downloadDocument = (d: StageDocument) => download(`${BASE}/documents/${d.id}/fichier`, d.file_name ?? d.title)

  // ── Avis et notation ──
  feedbacks = async (type?: string, subject?: string): Promise<{ items: Feedback[]; types: Record<string, string>; subjects: Record<string, string> }> => {
    const q = new URLSearchParams()
    if (type) q.set('type', type)
    if (subject) q.set('subject', subject)
    return (await HttpService.get(`${BASE}/avis${q.toString() ? `?${q}` : ''}`)).data
  }
  publishFeedback = (id: number, pub: boolean) => HttpService.post(`${BASE}/avis/${id}/publication`, { public: pub })
  deleteFeedback = (id: number) => HttpService.delete(`${BASE}/avis/${id}`)
  downloadFeedbackFile = (f: Feedback) => download(`${BASE}/avis/${f.id}/fichier`, f.file_name ?? 'piece-jointe')
  ratings = async (): Promise<RatingsBoard> => (await HttpService.get(`${BASE}/notation`)).data

  // ── Évaluation des stagiaires ──
  toRate = async (): Promise<{ criteria: EvalCriterion[]; interns: EvalToRate[]; lead: boolean }> => (await HttpService.get(`${BASE}/evaluations`)).data
  saveEvaluation = (id: number, scores: Record<string, number>, comment: string) => HttpService.post(`${BASE}/evaluations/${id}`, { scores, comment })
  board = async (): Promise<{ criteria: EvalCriterion[]; items: EvalBoardItem[] }> => (await HttpService.get(`${BASE}/evaluations/suivi`)).data
  returnEvaluation = (id: number, userId: number, note: string) => HttpService.post(`${BASE}/evaluations/${id}/renvoi`, { user_id: userId, note })
  validateEvaluation = (id: number, appreciation: string) => HttpService.post(`${BASE}/evaluations/${id}/validation`, { appreciation })
  downloadBulletin = (item: EvalBoardItem) => download(`${BASE}/evaluations/${item.id}/pdf`, `Bulletin d'evaluation de stage - ${item.reference}.pdf`)
}

export default new StageFeedbackService()
