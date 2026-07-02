import HttpService from './http.service.ts'

export interface AlumniRecord {
  id: number
  ecole: 'CAP' | 'EPAC'
  nom: string
  prenom: string
  civilite: string
  mail: string
  telephone: string
  situation_professionnelle: string
  autre_situation: string | null
  secteur_emploi: string
  secteur_professionnel: string
  type_emploi: string
  nom_entreprise: string | null
  annee_entree: string
  annee_sortie: string
  promotion: number
  formation: string
  autre_formation: string | null
  created_at: string
}

export interface AlumniListResponse {
  success: boolean
  data: AlumniRecord[]
  total: number
}

const alumniAdminService = {
  async getAll(filters: { ecole?: string; search?: string } = {}): Promise<AlumniListResponse> {
    const params = new URLSearchParams()
    if (filters.ecole) params.set('ecole', filters.ecole)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const response = await HttpService.get(`/admin/alumni${qs}`)
    return response.data as AlumniListResponse
  },
}

export default alumniAdminService
