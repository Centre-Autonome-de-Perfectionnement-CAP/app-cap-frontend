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
   * Récupère un tarif par son ID
   */
  getTarifById = async (id: number) => {
    return await HttpService.get(`${FINANCE_ROUTES.TARIFS}/${id}`)
  }

  /**
   * Récupère les classes disponibles pour une année académique
   */
  getAvailableClasses = async (academicYearId: number) => {
    return await HttpService.get(`${FINANCE_ROUTES.TARIFS}/available-classes?academic_year_id=${academicYearId}`)
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
    
    const url = `/finance/dashboard/stats?${params.toString()}`
    return await HttpService.get(url)
  }

  // ==================== MÉTHODES GÉNÉRIQUES ====================
  
  // ==================== TRANSACTIONS ====================
  
  getStudentTransactions = async (studentPendingStudentId: number) => {
    return await HttpService.get(`/finance/transactions/student/${studentPendingStudentId}`)
  }
  
  getStudentBalance = async (studentPendingStudentId: number) => {
    return await HttpService.get(`/finance/transactions/student/${studentPendingStudentId}/balance`)
  }
  
  // ==================== EXONÉRATIONS ====================
  
  getExonerations = async (filters?: any) => {
    return await HttpService.get('/finance/exonerations', { params: filters })
  }
  
  createExoneration = async (data: any) => {
    return await HttpService.post('/finance/exonerations', data)
  }
  
  updateExoneration = async (id: number, data: any) => {
    return await HttpService.put(`/finance/exonerations/${id}`, data)
  }
  
  deleteExoneration = async (id: number) => {
    return await HttpService.delete(`/finance/exonerations/${id}`)
  }
  
  // ==================== ÉTAT FINANCIER ÉTUDIANT ====================
  
  getStudentFinancialState = async (studentPendingStudentId: number, academicYearId: number) => {
    return await HttpService.get(`/finance/student/${studentPendingStudentId}/financial-state`, {
      params: { academic_year_id: academicYearId }
    })
  }
  
  submitPayment = async (formData: FormData) => {
    return await HttpService.post('/finance/student/submit-payment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
  
  // ==================== RAPPORTS ====================
  
  exportPayments = async (filters?: any) => {
    return await HttpService.get('/finance/reports/export-payments', { 
      params: filters, 
      responseType: 'blob' 
    })
  }
  
  getFinancialStatsByDepartment = async (academicYearId: number, departmentId?: number) => {
    return await HttpService.get('/finance/reports/stats-by-department', {
      params: { academic_year_id: academicYearId, department_id: departmentId }
    })
  }
  
  getRevenueByPeriod = async (startDate: string, endDate: string, groupBy: 'day' | 'month' = 'month') => {
    return await HttpService.get('/finance/reports/revenue-by-period', {
      params: { start_date: startDate, end_date: endDate, group_by: groupBy }
    })
  }

  /**
   * Méthode GET générique
   */
  get = async (endpoint: string, config?: any) => {
    return await HttpService.get(endpoint, config)
  }

  /**
   * Méthode POST générique
   */
  post = async (endpoint: string, data?: any, config?: any) => {
    return await HttpService.post(endpoint, data, config)
  }
}

const financeService = new FinanceService()
export { financeService }
export default financeService
