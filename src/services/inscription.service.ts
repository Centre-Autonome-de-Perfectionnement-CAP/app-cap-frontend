import HttpService from './http.service.ts'
import { INSCRIPTION_ROUTES } from '@/constants/routes.constants'
import type { DashboardStats, GraphesData, AcademicYear, PendingStudentData } from '@/types/inscription.types'
import { formatDateTimeForAPI } from '@/utils/date.utils'

type NiveauOption = {
  value: string
  label: string
}

type NiveauxResponse = {
  data: Record<string, NiveauOption[]>
}

/**
 * Service pour le module Inscription
 * Adapté aux vraies routes du backend Laravel
 */
class InscriptionService {
  // ==================== DASHBOARD ====================
  
  /**
   * Récupère les statistiques du dashboard
   */
  stats = async (): Promise<DashboardStats> => {
    const response = await HttpService.get<{data: DashboardStats}>(INSCRIPTION_ROUTES.STATS)
    return response.data
  }

  /**
   * Récupère les données des graphiques pour une année académique
   */
  graphes = async (year: string): Promise<GraphesData> => {
    const response = await HttpService.get<{data: GraphesData}>(`${INSCRIPTION_ROUTES.GRAPHES}?year=${year}`)
    return response.data
  }

  // ==================== ACADEMIC YEARS ====================
  
  /**
   * Récupère la liste des années académiques
   */
  academicYears = async (): Promise<AcademicYear[]> => {
    const response = await HttpService.get<{data: AcademicYear[]}>(INSCRIPTION_ROUTES.ACADEMIC_YEARS)
    return response.data
  }

  /**
   * Crée une nouvelle année académique
   */
  createAcademicYear = async (data: {
    year_start: string,
    year_end: string,
    submission_start?: string,
    submission_end?: string,
    departments?: number[]
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.ACADEMIC_YEARS, data)
  }

  /**
   * Met à jour une année académique
   */
  updateAcademicYear = async (yearId: number, data: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.ACADEMIC_YEAR(yearId), data)
  }

  /**
   * Supprime une année académique
   */
  deleteAcademicYear = async (yearId: number) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.ACADEMIC_YEAR(yearId))
  }

  /**
   * Ajoute des périodes à une année académique
   */
  addPeriods = async (yearId: number, data: {
    start_date: string,
    end_date: string,
    departments: number[]
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data)
  }

  /**
   * Étend des périodes d'une année académique
   */
  extendPeriods = async (yearId: number, data: {
    start_date: string,
    old_end_date: string,
    new_end_date: string,
    departments: number[]
  }) => {
    return await HttpService.put(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data)
  }

  /**
   * Supprime des périodes d'une année académique
   */
  deletePeriods = async (yearId: number, data: {
    start_date: string,
    end_date: string,
    departments: number[]
  }) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data)
  }

  /**
   * Ajoute une période à une année académique (alias pour addPeriods)
   */
  addPeriod = async (
    yearId: number,
    type: string,
    startDate: Date,
    startTime: Date,
    endDate: Date,
    endTime: Date,
    selectedFilieres: number[]
  ) => {
    return await HttpService.post(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), {
      start_date: formatDateTimeForAPI(startDate, startTime),
      end_date: formatDateTimeForAPI(endDate, endTime),
      departments: selectedFilieres,
      type
    })
  }

  /**
   * Récupère les périodes d'une année académique
   */
  getPeriods = async (yearId: number) => {
    const response = await HttpService.get(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId))
    return response.data || response
  }

  // ==================== PENDING STUDENTS ====================
  
  /**
   * Récupère les étudiants en attente avec pagination et filtres
   */
  pendingStudents = async (filters: {
    status?: string,
    department_id?: number,
    academic_year_id?: number,
    entry_diploma_id?: number,
    level?: string,
    search?: string,
    page?: number,
    per_page?: number
  } = {}): Promise<{ data: PendingStudentData[]; meta: any }> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = `${INSCRIPTION_ROUTES.PENDING_STUDENTS}?${params.toString()}`
    return await HttpService.get<{data: PendingStudentData[]; meta: any}>(url)
  }

  /**
   * Récupère un étudiant en attente par ID
   */
  getPendingStudent = async (id: number | string) => {
    return await HttpService.get(INSCRIPTION_ROUTES.PENDING_STUDENT(id))
  }

  /**
   * Crée un étudiant en attente
   */
  createPendingStudent = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.PENDING_STUDENTS, data)
  }

  /**
   * Met à jour un étudiant en attente
   */
  updatePendingStudent = async (id: number | string, data: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.PENDING_STUDENT(id), data)
  }

  /**
   * Supprime un étudiant en attente
   */
  deletePendingStudent = async (id: number | string) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.PENDING_STUDENT(id))
  }

  /**
   * Met à jour le statut financier d'un étudiant
   */
  updateFinancialStatus = async (id: number | string, data: {
    exonere?: 'Oui' | 'Non',
    sponsorise?: 'Oui' | 'Non'
  }) => {
    return await HttpService.patch(INSCRIPTION_ROUTES.PENDING_STUDENT_STATUS(id), data)
  }

  /**
   * Met à jour les pièces d'un étudiant
   */
  updatePieces = async (id: number | string, pieces: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.PENDING_STUDENT(id), { pieces })
  }

  /**
   * Envoie un mail aux étudiants
   */
  sendMail = async (studentsData: any) => {
    return await HttpService.post(`${INSCRIPTION_ROUTES.BASE}/send-mail`, { students: studentsData })
  }

  /**
   * Exporte les données
   */
  exportData = async (endpoint: string) => {
    return await HttpService.get(endpoint)
  }

  /**
   * Récupère la liste des étudiants avec pagination et filtres
   */
  studentsList = async (
    year: string,
    filiere: string,
    entryDiploma: string,
    redoublant: string,
    niveau: string,
    page: number,
    search: string,
    perPage?: number
  ) => {
    const params = new URLSearchParams()
    if (year !== 'all') params.append('year', year)
    if (filiere !== 'all') params.append('filiere', filiere)
    if (entryDiploma !== 'all') params.append('entry_diploma', entryDiploma)
    if (redoublant !== 'all') params.append('redoublant', redoublant)
    if (niveau !== 'all') params.append('niveau', niveau)
    if (search) params.append('search', search)
    params.append('page', page.toString())
    if (perPage) params.append('per_page', perPage.toString())
    
    const response = await HttpService.get(`${INSCRIPTION_ROUTES.BASE}/students?${params.toString()}`)
    
    // Transform Laravel pagination structure to expected format
    if (response.data && response.data.data) {
      return {
        data: response.data.data,
        totalPages: response.data.last_page,
        currentPage: response.data.current_page,
        total: response.data.total
      }
    }
    
    return response
  }

  /**
   * Récupère les détails d'un étudiant
   */
  getStudentDetails = async (studentId: number | string) => {
    const response = await HttpService.get(`${INSCRIPTION_ROUTES.BASE}/students/${studentId}`)
    return response.data || response
  }

  /**
   * Met à jour les informations d'un étudiant
   */
  updateStudent = async (studentId: number | string, data: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    gender?: string
    date_of_birth?: string
  }) => {
    return await HttpService.put(`${INSCRIPTION_ROUTES.BASE}/students/${studentId}`, data)
  }

  /**
   * Exporte la liste des étudiants en PDF
   */
  exportList = async (type: string, year: string, filiere: string, niveau: string, groupe?: string) => {
    const params = new URLSearchParams({
      year,
      filiere,
      niveau
    })
    
    if (groupe) {
      params.append('groupe', groupe)
    }
    
    return await HttpService.downloadFile(
      `${INSCRIPTION_ROUTES.BASE}/students/export/${type}?${params.toString()}`
    )
  }

  /**
   * Soumet des documents pour un étudiant en attente
   */
  submitDocuments = async (id: number | string, documents: File[], documentTypes: string[]) => {
    const formData = new FormData()
    documents.forEach((doc) => formData.append('documents[]', doc))
    documentTypes.forEach((type) => formData.append('document_types[]', type))
    
    return await HttpService.post(INSCRIPTION_ROUTES.PENDING_STUDENT_DOCUMENTS(id), formData)
  }

  /**
   * Récupère les documents d'un étudiant en attente
   */
  getDocuments = async (id: number | string) => {
    return await HttpService.get(INSCRIPTION_ROUTES.PENDING_STUDENT_DOCUMENTS(id))
  }

  // ==================== REFERENCE DATA ====================
  
  /**
   * Récupère la liste des cycles
   */
  getCycles = async () => {
    const response = await HttpService.get<{data: any}>(INSCRIPTION_ROUTES.CYCLES)
    return response.data
  }

  /**
   * Récupère la liste des filières avec périodes
   */
  getFilieres = async () => {
    const response = await HttpService.get<{data: any}>(INSCRIPTION_ROUTES.FILIERES)
    return response.data
  }

  /**
   * Récupère la prochaine deadline
   */
  getNextDeadline = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.NEXT_DEADLINE)
  }

  /**
   * Récupère les années académiques publiques
   */
  getPublicAcademicYears = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.PUBLIC_ACADEMIC_YEARS)
  }

  /**
   * Récupère les diplômes d'entrée
   */
  getEntryDiplomas = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.PUBLIC_ENTRY_DIPLOMAS)
  }

  /**
   * Récupère les niveaux d'études par filière
   */
  getNiveaux = async () => {
    const response = await HttpService.get<NiveauxResponse>(INSCRIPTION_ROUTES.NIVEAUX)
    return response.data
  }

  /**
   * Récupère toutes les options de filtrage (filières, années, diplômes d'entrée, statuts, niveaux)
   */
  filterOptions = async () => {
    try {
      const [filieres, years, entryDiplomas, niveaux] = await Promise.all([
        this.getFilieres(),
        this.academicYears(),
        this.getEntryDiplomas(),
        this.getNiveaux()
      ])
      
      // Statuts disponibles pour les étudiants en attente
      const statuts = [
        { value: 'pending', label: 'En attente' },
        { value: 'approved', label: 'Approuvé' },
        { value: 'rejected', label: 'Rejeté' }
      ]
      
      return {
        filieres: filieres || [],
        years: years || [],
        entryDiplomas: entryDiplomas?.data || [],
        statuts,
        niveaux: niveaux || {}
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de filtrage:', error)
      return {
        filieres: [],
        years: [],
        entryDiplomas: [],
        statuts: [],
        niveaux: {}
      }
    }
  }

  // ==================== SUBMISSIONS ====================
  
  /**
   * Récupère les périodes de soumission actives
   */
  getActivePeriods = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.ACTIVE_PERIODS)
  }

  /**
   * Récupère les périodes de réclamation actives
   */
  getActiveReclamationPeriods = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.ACTIVE_RECLAMATION_PERIODS)
  }

  /**
   * Vérifie le statut d'une soumission
   */
  checkSubmissionStatus = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CHECK_SUBMISSION_STATUS, data)
  }

  /**
   * Vérifie le statut d'une réclamation
   */
  checkReclamationStatus = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CHECK_RECLAMATION_STATUS, data)
  }

  // ==================== CLASS GROUPS ====================
  
  /**
   * Récupère les groupes d'une classe
   */
  getClassGroups = async (academicYearId: number, departmentId: number, studyLevel: string) => {
    const params = new URLSearchParams({
      academic_year_id: academicYearId.toString(),
      department_id: departmentId.toString(),
      study_level: studyLevel,
    })
    return await HttpService.get(`${INSCRIPTION_ROUTES.CLASS_GROUPS}?${params.toString()}`)
  }

  /**
   * Crée des groupes pour une classe
   */
  createClassGroups = async (data: {
    academic_year_id: number,
    department_id: number,
    study_level: string,
    replace_existing?: boolean,
    groups: Array<{
      name: string,
      student_ids: number[]
    }>
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CLASS_GROUPS, data)
  }

  /**
   * Récupère les détails d'un groupe
   */
  getClassGroupDetails = async (groupId: number) => {
    return await HttpService.get(INSCRIPTION_ROUTES.CLASS_GROUP(groupId))
  }

  /**
   * Supprime un groupe
   */
  deleteClassGroup = async (groupId: number) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.CLASS_GROUP(groupId))
  }

  /**
   * Supprime tous les groupes d'une classe
   */
  deleteAllClassGroups = async (academicYearId: number, departmentId: number, studyLevel: string) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CLASS_GROUPS_DELETE_ALL, {
      academic_year_id: academicYearId,
      department_id: departmentId,
      study_level: studyLevel,
    })
  }
}

export default new InscriptionService()
