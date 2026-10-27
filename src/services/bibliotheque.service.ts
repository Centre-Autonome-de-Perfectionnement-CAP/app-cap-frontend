// src/services/bibliotheque.service.ts
// Bibliothèque des travaux (responsable de division) : rapports de fin de
// formation, mémoires, ajouts manuels ; publication publique ou par lien.

import HttpService from './http.service'
import { localFileFrom, type LocalFile } from '@/utils/base64File'

const BASE = 'bibliotheque/admin'

export type WorkStatus = 'proposed' | 'draft' | 'published' | 'unpublished'
export type WorkKind = 'rapport_stage' | 'memoire'
export type PersonRole = 'auteur' | 'maitre' | 'superviseur'

export interface WorkRow {
  id: number; slug: string; kind: WorkKind; kind_label: string; source_type: 'stage_report' | 'defense' | 'manuel'
  status: WorkStatus; status_label: string; visibility: 'public' | 'link'; title: string; year: number | null
  formation: string; authors: string; views: number; downloads: number; url: string | null; published_at: string | null
}

export interface WorkPerson { id?: number; role: PersonRole; name: string; fonction: string | null; email: string | null; phone: string | null }

export interface WorkDetail extends WorkRow {
  summary: string | null; keywords: string[]; etablissement: string | null; universite: string | null
  filiere: string | null; cycle: string | null; annee_etude: number | null
  license: 'tous_droits' | 'cc_by_nc'; downloadable: boolean; has_file: boolean; authors_consent: boolean
  people: WorkPerson[]; share_url: string
  messages: { id: number; sender_name: string; sender_email: string; message: string; created_at: string; to_name: string | null }[]
}

export interface WorkForm {
  kind: WorkKind; title: string; summary: string; keywords: string; year: string
  etablissement: string; universite: string; filiere: string; cycle: string; annee_etude: string
  people: WorkPerson[]
}

export interface Candidate { type: 'stage_report' | 'defense'; id: number; title: string; authors: string; reference: string; year: number | null; detail: string }

const payload = (f: WorkForm) => ({
  ...f, year: f.year ? Number(f.year) : null, annee_etude: f.annee_etude ? Number(f.annee_etude) : null, cycle: f.cycle || null,
})

class BibliothequeService {
  list = async (status?: WorkStatus, q?: string): Promise<{ works: WorkRow[]; counts: Partial<Record<WorkStatus, number>> }> =>
    (await HttpService.get(`${BASE}/travaux`, { params: { status, q: q || undefined } })).data

  candidates = async (): Promise<{ reports: Candidate[]; defenses: Candidate[] }> => (await HttpService.get(`${BASE}/candidats`)).data

  show = async (id: number): Promise<WorkDetail> => (await HttpService.get(`${BASE}/travaux/${id}`)).data

  import = async (type: Candidate['type'], id: number): Promise<WorkDetail> => (await HttpService.post(`${BASE}/import`, { type, id })).data

  /** Travail ajouté à la main (PDF obligatoire). */
  create = async (f: WorkForm, file: File): Promise<WorkDetail> => {
    const fd = new FormData()
    Object.entries(payload(f)).forEach(([k, v]) => {
      if (k === 'people') return
      if (v !== null && v !== '') fd.append(k, String(v))
    })
    f.people.forEach((p, i) => (['role', 'name', 'fonction', 'email', 'phone'] as const)
      .forEach(k => { if (p[k]) fd.append(`people[${i}][${k}]`, String(p[k])) }))
    fd.append('fichier', file)
    return (await HttpService.post(`${BASE}/travaux`, fd)).data
  }

  update = async (id: number, f: WorkForm): Promise<WorkDetail> => (await HttpService.put(`${BASE}/travaux/${id}`, payload(f))).data

  replaceFile = async (id: number, file: File): Promise<WorkDetail> => {
    const fd = new FormData()
    fd.append('fichier', file)
    return (await HttpService.post(`${BASE}/travaux/${id}/fichier`, fd)).data
  }

  file = async (id: number): Promise<LocalFile> => localFileFrom(await HttpService.get(`${BASE}/travaux/${id}/fichier`), 'travail.pdf', 'application/pdf')

  publish = async (id: number, p: { visibility: 'public' | 'link'; downloadable: boolean; license: string }): Promise<WorkDetail> =>
    (await HttpService.post(`${BASE}/travaux/${id}/publier`, p)).data

  unpublish = async (id: number): Promise<WorkDetail> => (await HttpService.post(`${BASE}/travaux/${id}/retirer`)).data

  renewLink = async (id: number): Promise<WorkDetail> => (await HttpService.post(`${BASE}/travaux/${id}/nouveau-lien`)).data

  remove = (id: number) => HttpService.delete(`${BASE}/travaux/${id}`)
}

export default new BibliothequeService()
