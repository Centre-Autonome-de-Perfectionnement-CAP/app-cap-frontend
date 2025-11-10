import HttpService from './http.service.ts'
import { FINANCE_ROUTES } from '@/constants/routes.constants'
import type { 
  Paiement, 
  CreatePaiementData, 
  PaiementFilters, 
  PaiementsResponse,
  StudentInfo
} from '@/types/finance.types'

/**
 * Service pour le module Finance
 * Adapté aux vraies routes du backend Laravel
 */
class FinanceService {
  // ==================== PAIEMENTS ====================
  
  /**
   * Récupère la liste des paiements avec filtres et pagination
   */
  getPaiements = async (filters: PaiementFilters = {}): Promise<PaiementsResponse> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = `${FINANCE_ROUTES.PAIEMENTS}?${params.toString()}`
    const response = await HttpService.get<PaiementsResponse>(url)
    return response
  }

  /**
   * Crée un nouveau paiement
   */
  createPaiement = async (data: CreatePaiementData) => {
    const formData = new FormData()
    formData.append('matricule', data.matricule)
    formData.append('montant', data.montant.toString())
    formData.append('reference', data.reference)
    formData.append('numero_compte', data.numero_compte)
    formData.append('date_versement', data.date_versement)
    formData.append('quittance', data.quittance)
    formData.append('motif', data.motif)
    
    if (data.email) formData.append('email', data.email)
    if (data.contact) formData.append('contact', data.contact)

    return await HttpService.post(FINANCE_ROUTES.PAIEMENTS, formData)
  }

  /**
   * Récupère un paiement par sa référence
   */
  getPaiementByReference = async (reference: string): Promise<Paiement> => {
    const response = await HttpService.get<{data: Paiement}>(`${FINANCE_ROUTES.PAIEMENTS}/${reference}`)
    return response.data
  }

  /**
   * Récupère les informations d'un étudiant par matricule
   */
  getStudentInfo = async (matricule: string): Promise<StudentInfo> => {
    const response = await HttpService.get<{data: StudentInfo}>(`${FINANCE_ROUTES.PAIEMENTS}/student/${matricule}`)
    return response.data
  }

  // ==================== QUITTANCES ====================
  
  /**
   * Récupère la liste des quittances
   */
  getQuittances = async (filters: any = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = `${FINANCE_ROUTES.QUITTANCES}?${params.toString()}`
    return await HttpService.get(url)
  }

  /**
   * Valide une quittance
   */
  validateQuittance = async (id: number | string) => {
    return await HttpService.post(FINANCE_ROUTES.QUITTANCE_VALIDATE(id), {})
  }

  /**
   * Rejette une quittance
   */
  rejectQuittance = async (id: number | string, motif: string) => {
    return await HttpService.post(FINANCE_ROUTES.QUITTANCE_REJECT(id), { motif })
  }

  // ==================== TARIFS ====================
  
  /**
   * Récupère la liste des tarifs
   */
  getTarifs = async () => {
    return await HttpService.get(FINANCE_ROUTES.TARIFS)
  }

  /**
   * Crée un nouveau tarif
   */
  createTarif = async (data: any) => {
    return await HttpService.post(FINANCE_ROUTES.TARIFS, data)
  }

  /**
   * Met à jour un tarif
   */
  updateTarif = async (id: number | string, data: any) => {
    return await HttpService.put(FINANCE_ROUTES.TARIF(id), data)
  }

  /**
   * Supprime un tarif
   */
  deleteTarif = async (id: number | string) => {
    return await HttpService.delete(FINANCE_ROUTES.TARIF(id))
  }

  // ==================== COMPTE ETUDIANT ====================
  
  /**
   * Récupère le compte d'un étudiant
   */
  getCompteEtudiant = async (etudiantId: number | string) => {
    return await HttpService.get(FINANCE_ROUTES.COMPTE_ETUDIANT(etudiantId))
  }

  // ==================== STATISTIQUES ====================
  
  /**
   * Récupère les statistiques financières
   */
  getStatistics = async (filters: any = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = `${FINANCE_ROUTES.STATISTICS}?${params.toString()}`
    return await HttpService.get(url)
  }
}

export default new FinanceService()
