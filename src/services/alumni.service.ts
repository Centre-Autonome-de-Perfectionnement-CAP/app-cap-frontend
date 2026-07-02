import HttpService from './http.service.ts'
import { ALUMNI_ROUTES } from '@/constants/routes.constants'

export interface Alumni {
  id: number
  ecole: 'CAP' | 'EPAC'
  nom: string
  prenom: string
  civilite: 'Monsieur' | 'Madame'
  mail: string
  telephone: string
  situation_professionnelle: string
  autre_situation: string | null
  secteur_emploi: string
  secteur_professionnel: string
  type_emploi: 'Employeur' | 'Employe' | 'Aucun'
  nom_entreprise: string | null
  annee_entree: string
  annee_sortie: string
  promotion: number
  formation: string
  autre_formation: string | null
  created_at: string
  updated_at: string
}

export interface AlumniDashboardStats {
  totaux: {
    total: number
    cap: number
    epac: number
    inseres: number
    taux_insertion: number
    recents_30j: number
  }
  par_ecole: Record<string, number>
  par_type_emploi: Record<string, number>
  par_situation: Array<{ situation: string; total: number }>
  par_civilite: Record<string, number>
  top_formations: Array<{ formation: string; total: number }>
  top_secteurs_emploi: Array<{ secteur: string; total: number }>
  top_secteurs_prof: Array<{ secteur: string; total: number }>
  par_annee_sortie: Array<{ annee: string; total: number }>
  promotions: Record<string, number>
}

export interface AlumniFilters {
  ecole?: string
  formation?: string
  annee_sortie?: string
  promotion?: string
  situation_professionnelle?: string
  type_emploi?: string
  secteur_emploi?: string
  search?: string
  per_page?: number
  page?: number
}

const buildQuery = (params?: Record<string, any>): string => {
  if (!params) return ''
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

class AlumniService {
  // ── Dashboard KPI ──────────────────────────────────────────────────────────

  getDashboard = async (filters?: { ecole?: string; annee_sortie?: string }): Promise<AlumniDashboardStats> => {
    const url = ALUMNI_ROUTES.DASHBOARD + buildQuery(filters)
    const response = await HttpService.get<{ success: boolean; data: AlumniDashboardStats }>(url)
    return response.data
  }

  // ── Liste paginée ──────────────────────────────────────────────────────────

  getAll = async (filters?: AlumniFilters): Promise<{ data: Alumni[]; meta: any }> => {
    const url = ALUMNI_ROUTES.LIST + buildQuery(filters)
    const response = await HttpService.get<{ success: boolean; data: Alumni[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  // ── Détail ─────────────────────────────────────────────────────────────────

  getById = async (id: number): Promise<Alumni> => {
    const response = await HttpService.get<{ success: boolean; data: Alumni }>(ALUMNI_ROUTES.DETAIL(id))
    return response.data
  }

  // ── Mise à jour ────────────────────────────────────────────────────────────

  update = async (id: number, data: Partial<Alumni>): Promise<Alumni> => {
    const response = await HttpService.put<{ success: boolean; data: Alumni }>(ALUMNI_ROUTES.UPDATE(id), data)
    return response.data
  }

  // ── Suppression ────────────────────────────────────────────────────────────

  delete = async (id: number): Promise<void> => {
    await HttpService.delete(ALUMNI_ROUTES.DELETE(id))
  }

  // ── Soumission publique ────────────────────────────────────────────────────

  submit = async (data: Omit<Alumni, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: number }> => {
    const response = await HttpService.post<{ success: boolean; data: { id: number } }>(ALUMNI_ROUTES.SUBMIT, data)
    return response.data
  }
}

export default new AlumniService()
