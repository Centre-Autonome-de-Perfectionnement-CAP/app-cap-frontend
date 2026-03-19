// services/inscription.service.ts
import HttpService from './http.service';
import { INSCRIPTION_ROUTES } from '@/constants/routes.constants';
import type { DashboardStats, GraphesData, AcademicYear, PendingStudentData } from '@/types/inscription.types';
import { formatDateTimeForAPI } from '@/utils/date.utils';

// Types spécifiques pour le responsable
export interface ClassGroup {
  id: number;
  group_name: string | null;
  study_level: string | number;
  filiere: string;
  cycle?: string;
  total_etudiants: number;
  academic_year_id: number;
  academic_year_name: string;
  validation_average?: number | string;
}

export interface ClassByYear {
  academic_year_id: number;
  academic_year_name: string;
  classes: ClassGroup[];
}

export interface StudentRow {
  id: number;
  matricule?: string;
  nomPrenoms: string;
  email: string;
  sexe: string;
  redoublant: string;
  telephone?: string;
  date_naissance?: string;
  lieu_naissance?: string;
}

export interface DashboardResponse {
  class_info: {
    filiere: string;
    niveau: string;
    annee: string;
    groupe?: string;
    totalEtudiants: number;
  };
  students: StudentRow[];
}

export interface ClassesResponse {
  classes_by_year: ClassByYear[];
}

type NiveauOption = {
  id: string;
  name: string;
};

type NiveauxResponse = {
  data: Record<string, NiveauOption[]>;
};

/**
 * Service pour le module Inscription
 * Adapté aux vraies routes du backend Laravel
 */
class InscriptionService {
  
  // ==================== DASHBOARD STATS ====================
  
  /**
   * Récupère les statistiques du dashboard
   */
  stats = async (): Promise<DashboardStats> => {
    const response = await HttpService.get<{data: DashboardStats}>(INSCRIPTION_ROUTES.STATS);
    return response.data;
  };

  /**
   * Récupère les données des graphiques pour une année académique
   */
  graphes = async (year: string): Promise<GraphesData> => {
    const response = await HttpService.get<{data: GraphesData}>(`${INSCRIPTION_ROUTES.GRAPHES}?year=${year}`);
    return response.data;
  };
  
  // ==================== ACADEMIC YEARS ====================
  
  /**
   * Récupère la liste des années académiques
   */
  academicYears = async (): Promise<AcademicYear[]> => {
    const response = await HttpService.get<{data: AcademicYear[]}>(INSCRIPTION_ROUTES.ACADEMIC_YEARS);
    return response.data;
  };

  /**
   * Crée une nouvelle année académique
   */
  createAcademicYear = async (data: {
    year_start: string;
    year_end: string;
    submission_start?: string;
    submission_end?: string;
    departments?: number[];
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.ACADEMIC_YEARS, data);
  };

  /**
   * Met à jour une année académique
   */
  updateAcademicYear = async (yearId: number, data: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.ACADEMIC_YEAR(yearId), data);
  };

  /**
   * Supprime une année académique
   */
  deleteAcademicYear = async (yearId: number) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.ACADEMIC_YEAR(yearId));
  };

  // ==================== PERIODS ====================
  
  /**
   * Ajoute des périodes à une année académique
   */
  addPeriods = async (yearId: number, data: {
    start_date: string;
    end_date: string;
    departments: number[];
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data);
  };

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
    });
  };

  /**
   * Étend des périodes d'une année académique
   */
  extendPeriods = async (yearId: number, data: {
    start_date: string;
    old_end_date: string;
    new_end_date: string;
    departments: number[];
  }) => {
    return await HttpService.put(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data);
  };

  /**
   * Supprime des périodes d'une année académique
   */
  deletePeriods = async (yearId: number, data: {
    start_date: string;
    end_date: string;
    departments: number[];
  }) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId), data);
  };

  /**
   * Récupère les périodes d'une année académique
   */
  getPeriods = async (yearId: number) => {
    const response = await HttpService.get(INSCRIPTION_ROUTES.ACADEMIC_YEAR_PERIODS(yearId));
    return response.data || response;
  };
  
  // ==================== PENDING STUDENTS ====================
  
  /**
   * Récupère les étudiants en attente avec pagination et filtres
   */
  pendingStudents = async (filters: {
    status?: string;
    department_id?: number;
    academic_year_id?: number;
    entry_diploma_id?: number;
    level?: string;
    search?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<{ data: PendingStudentData[]; meta: any }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `${INSCRIPTION_ROUTES.PENDING_STUDENTS}?${queryString}` : INSCRIPTION_ROUTES.PENDING_STUDENTS;
    return await HttpService.get<{data: PendingStudentData[]; meta: any}>(url);
  };

  /**
   * Récupère un étudiant en attente par ID
   */
  getPendingStudent = async (id: number | string) => {
    return await HttpService.get(INSCRIPTION_ROUTES.PENDING_STUDENT(id));
  };

  /**
   * Crée un étudiant en attente
   */
  createPendingStudent = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.PENDING_STUDENTS, data);
  };

  /**
   * Met à jour un étudiant en attente
   */
  updatePendingStudent = async (id: number | string, data: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.PENDING_STUDENT(id), data);
  };

  /**
   * Supprime un étudiant en attente
   */
  deletePendingStudent = async (id: number | string) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.PENDING_STUDENT(id));
  };

  /**
   * Met à jour le statut financier d'un étudiant
   */
  updateFinancialStatus = async (id: number | string, data: {
    exonere?: 'Oui' | 'Non';
    sponsorise?: 'Oui' | 'Non';
  }) => {
    return await HttpService.patch(INSCRIPTION_ROUTES.PENDING_STUDENT_STATUS(id), data);
  };

  /**
   * Met à jour le niveau d'études d'un étudiant
   */
  updateLevel = async (id: number | string, level: string) => {
    return await HttpService.patch(`${INSCRIPTION_ROUTES.PENDING_STUDENTS}/${id}/level`, { level });
  };

  /**
   * Met à jour les pièces d'un étudiant
   */
  updatePieces = async (id: number | string, pieces: any) => {
    return await HttpService.put(INSCRIPTION_ROUTES.PENDING_STUDENT(id), { pieces });
  };

  /**
   * Renomme une pièce pour un étudiant
   */
  renamePiece = async (id: number | string, pieceKey: string, customName: string) => {
    return await HttpService.patch(`${INSCRIPTION_ROUTES.PENDING_STUDENTS}/${id}/pieces/rename`, {
      piece_key: pieceKey,
      custom_name: customName
    });
  };

  /**
   * Soumet des documents pour un étudiant en attente
   */
  submitDocuments = async (id: number | string, documents: File[], documentTypes: string[]) => {
    const formData = new FormData();
    documents.forEach((doc) => formData.append('documents[]', doc));
    documentTypes.forEach((type) => formData.append('document_types[]', type));
    
    return await HttpService.post(INSCRIPTION_ROUTES.PENDING_STUDENT_DOCUMENTS(id), formData);
  };

  /**
   * Récupère les documents d'un étudiant en attente
   */
  getDocuments = async (id: number | string) => {
    return await HttpService.get(INSCRIPTION_ROUTES.PENDING_STUDENT_DOCUMENTS(id));
  };

  // ==================== STUDENTS ====================
  
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
    perPage?: number,
    cohort?: string
  ) => {
    const params = new URLSearchParams();
    if (year !== 'all') params.append('year', year);
    if (filiere !== 'all') params.append('filiere', filiere);
    if (entryDiploma !== 'all') params.append('entry_diploma', entryDiploma);
    if (redoublant !== 'all') params.append('redoublant', redoublant);
    if (niveau !== 'all') params.append('niveau', niveau);
    if (cohort && cohort !== 'all') params.append('cohort', cohort);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    if (perPage) params.append('per_page', perPage.toString());
    
    const response = await HttpService.get(`${INSCRIPTION_ROUTES.BASE}/students?${params.toString()}`);
    if (response.data && response.data.data) {
      return {
        data: response.data.data,
        totalPages: response.data.last_page,
        currentPage: response.data.current_page,
        total: response.data.total
      };
    }
    
    return response;
  };

  /**
   * Récupère les détails d'un étudiant
   */
  getStudentDetails = async (studentId: number | string) => {
    const response = await HttpService.get(`${INSCRIPTION_ROUTES.BASE}/students/${studentId}`);
    return response.data || response;
  };

  /**
   * Met à jour les informations d'un étudiant
   */
  updateStudent = async (studentId: number | string, data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
  }) => {
    return await HttpService.put(`${INSCRIPTION_ROUTES.BASE}/students/${studentId}`, data);
  };

  // ==================== RESPONSABLE DE CLASSE ====================


  getResponsableDashboard = async (): Promise<DashboardResponse> => {
    const response = await HttpService.get<DashboardResponse>(
      `${INSCRIPTION_ROUTES.BASE}/responsable/dashboard`
    );
    return response.data || response;
  };

  getResponsableClasses = async (): Promise<ClassesResponse> => {
    const response = await HttpService.get<ClassesResponse>(
      `${INSCRIPTION_ROUTES.BASE}/responsable/classes`
    );
    return response.data || response;
  };


  getStudentsByClass = async (classId: number): Promise<{ students: StudentRow[] }> => {
    const response = await HttpService.get<{ students: StudentRow[] }>(
      `${INSCRIPTION_ROUTES.BASE}/classes/${classId}/students`
    );
    return response.data || response;
  };


  getClassStats = async (classId: number): Promise<{
    total: number;
    masculin: number;
    feminin: number;
    redoublants: number;
    nouveaux: number;
  }> => {
    const response = await HttpService.get(
      `${INSCRIPTION_ROUTES.BASE}/classes/${classId}/stats`
    );
    return response.data || response;
  };


  exportClassList = async (
    classId: number, 
    type: 'presence' | 'emargement' | 'liste'
  ): Promise<string> => {
    const result = await HttpService.downloadFile(
      `${INSCRIPTION_ROUTES.BASE}/classes/${classId}/export/${type}`
    );
    return result.url;
  };


  exportListForResponsable = async (type: 'fiche-presence' | 'fiche-emargement'): Promise<string> => {
    const result = await HttpService.downloadFile(
      `${INSCRIPTION_ROUTES.BASE}/responsable/export/${type}`
    );
    return result.url;
  };


  assignClassResponsible = async (studentId: number) => {
    return await HttpService.post(
      `${INSCRIPTION_ROUTES.BASE}/students/${studentId}/assign-class-responsible`,
      {}
    );
  };


  removeClassResponsible = async (studentId: number) => {
    return await HttpService.post(
      `${INSCRIPTION_ROUTES.BASE}/students/${studentId}/remove-class-responsible`,
      {}
    );
  };

  // ==================== CLASS GROUPS ====================
  

  getClassGroups = async (academicYearId: number, departmentId: number, studyLevel: string, cohort?: string) => {
    const params = new URLSearchParams({
      academic_year_id: academicYearId.toString(),
      department_id: departmentId.toString(),
      study_level: studyLevel,
    });
    if (cohort && cohort !== 'all') {
      params.append('cohort', cohort);
    }
    return await HttpService.get(`${INSCRIPTION_ROUTES.CLASS_GROUPS}?${params.toString()}`);
  };

  /**
   * Récupère les groupes par classe (pour création de programmes)
   */
  getClassGroupsByClass = async (classGroupId: number) => {
    return await HttpService.get(`${INSCRIPTION_ROUTES.CLASS_GROUPS}/by-class/${classGroupId}`);
  };

  /**
   * Crée des groupes pour une classe
   */
  createClassGroups = async (data: {
    academic_year_id: number;
    department_id: number;
    study_level: string;
    replace_existing?: boolean;
    groups: Array<{
      name: string;
      student_ids: number[];
    }>;
  }) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CLASS_GROUPS, data);
  };
  
  /**
   * Crée un groupe unique par défaut avec tous les étudiants d'une cohorte
   */
  createDefaultClassGroup = async (
    academicYearId: number,
    departmentId: number,
    studyLevel: string,
    cohort: string
  ) => {
    return await HttpService.post(`${INSCRIPTION_ROUTES.CLASS_GROUPS}/create-default`, {
      academic_year_id: academicYearId,
      department_id: departmentId,
      study_level: studyLevel,
      cohort: cohort,
    });
  };

  /**
   * Récupère les détails d'un groupe
   */
  getClassGroupDetails = async (groupId: number) => {
    return await HttpService.get(INSCRIPTION_ROUTES.CLASS_GROUP(groupId));
  };

  /**
   * Supprime un groupe
   */
  deleteClassGroup = async (groupId: number) => {
    return await HttpService.delete(INSCRIPTION_ROUTES.CLASS_GROUP(groupId));
  };

  /**
   * Supprime tous les groupes d'une classe
   */
  deleteAllClassGroups = async (academicYearId: number, departmentId: number, studyLevel: string) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CLASS_GROUPS_DELETE_ALL, {
      academic_year_id: academicYearId,
      department_id: departmentId,
      study_level: studyLevel,
    });
  };

  // ==================== FILTERS & OPTIONS ====================
  
  /**
   * Récupère la liste des cycles
   */
  getCycles = async () => {
    const response = await HttpService.get<{data: any}>(INSCRIPTION_ROUTES.CYCLES);
    return response.data;
  };

  /**
   * Récupère la liste des filières avec périodes
   */
  getFilieres = async () => {
    const response = await HttpService.get<{data: any}>(INSCRIPTION_ROUTES.FILIERES);
    return response.data;
  };

  /**
   * Récupère la prochaine deadline
   */
  getNextDeadline = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.NEXT_DEADLINE);
  };

  /**
   * Récupère les années académiques publiques
   */
  getPublicAcademicYears = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.PUBLIC_ACADEMIC_YEARS);
  };

  /**
   * Récupère les diplômes d'entrée
   */
  getEntryDiplomas = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.PUBLIC_ENTRY_DIPLOMAS);
  };

  /**
   * Récupère les niveaux d'études par filière
   */
  getNiveaux = async () => {
    const response = await HttpService.get<NiveauxResponse>(INSCRIPTION_ROUTES.NIVEAUX);
    return response.data;
  };

  /**
   * Récupère tous les niveaux d'études (format plat)
   */
  getAllNiveaux = async () => {
    const response = await HttpService.get<{data: Array<{value: string; label: string}>}>(INSCRIPTION_ROUTES.NIVEAUX_ALL);
    return response.data;
  };

  /**
   * Récupère les cohortes pour une année académique et optionnellement une filière
   */
  getCohorts = async (academicYearId?: number | string, departmentId?: number | string) => {
    const params = new URLSearchParams();
    if (academicYearId) params.append('academic_year_id', academicYearId.toString());
    if (departmentId) params.append('department_id', departmentId.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${INSCRIPTION_ROUTES.BASE}/cohortes?${queryString}` : `${INSCRIPTION_ROUTES.BASE}/cohortes`;
    const response = await HttpService.get(url);
    return response.data || [];
  };

  /**
   * Récupère toutes les options de filtrage (filières, années, diplômes d'entrée, statuts, niveaux)
   */
  filterOptions = async (academicYearId?: number | string) => {
    try {
      const [filieres, years, entryDiplomas, niveaux] = await Promise.all([
        this.getFilieres().catch(() => []),
        this.academicYears().catch(() => []),
        this.getEntryDiplomas().catch(() => ({ data: [] })),
        this.getAllNiveaux().catch(() => [])
      ]);
      
      // Statuts disponibles pour les étudiants en attente
      const statuts = [
        { value: 'pending', label: 'En attente' },
        { value: 'approved', label: 'Approuvé' },
        { value: 'rejected', label: 'Rejeté' }
      ];
      
      return {
        filieres: filieres || [],
        years: years || [],
        entryDiplomas: entryDiplomas?.data || [],
        statuts,
        niveaux: niveaux || [],
        cohorts: [] // Les cohortes sont chargées séparément via getCohorts()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des options de filtrage:', error);
      return {
        filieres: [],
        years: [],
        entryDiplomas: [],
        statuts: [
          { value: 'pending', label: 'En attente' },
          { value: 'approved', label: 'Approuvé' },
          { value: 'rejected', label: 'Rejeté' }
        ],
        niveaux: [],
        cohorts: []
      };
    }
  };
  
  // ==================== PERIODS & STATUS ====================
  
  /**
   * Récupère les périodes de soumission actives
   */
  getActivePeriods = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.ACTIVE_PERIODS);
  };

  /**
   * Récupère les périodes de réclamation actives
   */
  getActiveReclamationPeriods = async () => {
    return await HttpService.get(INSCRIPTION_ROUTES.ACTIVE_RECLAMATION_PERIODS);
  };

  /**
   * Vérifie le statut d'une soumission
   */
  checkSubmissionStatus = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CHECK_SUBMISSION_STATUS, data);
  };

  /**
   * Vérifie le statut d'une réclamation
   */
  checkReclamationStatus = async (data: any) => {
    return await HttpService.post(INSCRIPTION_ROUTES.CHECK_RECLAMATION_STATUS, data);
  };

  /**
   * Envoie un mail aux étudiants
   */
  sendMail = async (studentsData: any) => {
    return await HttpService.post(`${INSCRIPTION_ROUTES.BASE}/send-mail`, { students: studentsData });
  };

  /**
   * Exporte les données
   */
  exportData = async (endpoint: string) => {
    const result = await HttpService.downloadFile(endpoint);
    
    // Extraire le filename du header Content-Disposition si disponible
    if ((result as any).headers && (result as any).headers['content-disposition']) {
      const disposition = (result as any).headers['content-disposition'];
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        return { ...result, filename: filenameMatch[1] };
      }
    }
    
    return result;
  };
}

export default new InscriptionService();