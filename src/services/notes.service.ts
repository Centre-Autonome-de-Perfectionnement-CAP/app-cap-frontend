import HttpService from './http.service.ts'

class NotesService {
  private baseUrl = 'notes'

  // Professeur - Obtenir les classes regroupées par cycle
  getMyClasses = async (params?: {
    academic_year_id?: number
    department_id?: number
    cohort?: string
  }) => {
    const filteredParams: Record<string, string> = {}
    if (params) {
      if (params.academic_year_id) filteredParams.academic_year_id = params.academic_year_id.toString()
      if (params.department_id) filteredParams.department_id = params.department_id.toString()
      if (params.cohort) filteredParams.cohort = params.cohort
    }
    const queryParams = Object.keys(filteredParams).length > 0 
      ? `?${new URLSearchParams(filteredParams).toString()}` 
      : ''
    return await HttpService.get(`${this.baseUrl}/professor/my-classes${queryParams}`)
  }

  // Professeur - Obtenir les programmes d'une classe
  getProgramsByClass = async (classGroupId: number) => {
    return await HttpService.get(`${this.baseUrl}/professor/programs-by-class/${classGroupId}`)
  }

  // Professeur - Obtenir la fiche de notation
  getGradeSheet = async (programUuid: string, cohort?: string) => {
    const params = cohort ? `?cohort=${cohort}` : ''
    return await HttpService.get(`${this.baseUrl}/professor/grade-sheet/${programUuid}${params}`)
  }

  // Professeur - Obtenir les étudiants pour créer une évaluation
  getStudentsForEvaluation = async (programUuid: string, cohort?: string) => {
    const params = cohort ? `?cohort=${cohort}` : ''
    return await HttpService.get(`${this.baseUrl}/professor/students-for-evaluation/${programUuid}${params}`)
  }

  // Professeur - Créer une évaluation
  createEvaluation = async (programIdOrUuid: number | string, notes: Record<number, number>, isRetake = false) => {
    return await HttpService.post(`${this.baseUrl}/professor/create-evaluation`, {
      program_id: programIdOrUuid,
      notes,
      is_retake: isRetake
    })
  }

  // Professeur - Mettre à jour une note
  updateGrade = async (data: {
    student_pending_student_id: number
    program_id: string | number
    position: number
    value: number
  }) => {
    return await HttpService.put(`${this.baseUrl}/professor/update-grade`, data)
  }

  // Professeur - Définir la pondération
  setWeighting = async (programId: string | number, weighting: number[]) => {
    return await HttpService.put(`${this.baseUrl}/professor/set-weighting`, {
      program_id: programId,
      weighting
    })
  }

  // Professeur - Dupliquer une note
  duplicateGrade = async (programId: string | number, columnIndex: number, sessionNormale = true) => {
    return await HttpService.put(`${this.baseUrl}/professor/duplicate-grade`, {
      program_id: programId,
      column_index: columnIndex,
      session_normale: sessionNormale
    })
  }

  // Professeur - Supprimer une évaluation
  deleteEvaluation = async (programId: string | number, columnIndex: number, sessionNormale = true) => {
    return await HttpService.post(`${this.baseUrl}/professor/delete-evaluation`, {
      program_id: programId,
      column_index: columnIndex,
      session_normale: sessionNormale
    })
  }

  // Professeur - Exporter la fiche récapitulative
  exportGradeSheet = async (programUuid: string, includeRetake: boolean = false, cohort?: string) => {
    const params = new URLSearchParams()
    if (includeRetake) params.append('include_retake', 'true')
    if (cohort) params.append('cohort', cohort)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return await HttpService.downloadFile(`${this.baseUrl}/professor/export-grade-sheet/${programUuid}${queryString}`)
  }

  // Admin - Dashboard
  getDashboard = async (academicYearId?: number) => {
    const queryParams = academicYearId ? `?academic_year_id=${academicYearId}` : ''
    return await HttpService.get(`${this.baseUrl}/admin/dashboard${queryParams}`)
  }

  // Admin - Obtenir les notes par filière et niveau
  getGradesByDepartmentLevel = async (params: {
    academic_year_id?: number
    department_id?: number
    level?: string
    program_id?: number
    cohort?: string
  }) => {
    const queryParams = params ? `?${new URLSearchParams(params as any).toString()}` : ''
    return await HttpService.get(`${this.baseUrl}/admin/grades-by-department-level${queryParams}`)
  }

  // Admin - Détails d'un programme
  getProgramDetails = async (programId: number) => {
    return await HttpService.get(`${this.baseUrl}/admin/program-details/${programId}`)
  }

  // Admin - Exporter par filière
  exportGradesByDepartment = async (params: {
    academic_year_id: number
    department_id: number
    level?: string
    format?: 'pdf' | 'excel'
  }) => {
    return await HttpService.post(`${this.baseUrl}/admin/export-grades-by-department`, params)
  }

  // Décisions - Exporter PV fin d'année
  exportPVFinAnnee = async (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
  }) => {
    const queryParams = new URLSearchParams(params as any).toString()
    return await HttpService.downloadFile(`${this.baseUrl}/decisions/export-pv-fin-annee?${queryParams}`)
  }

  // Décisions - Exporter PV délibération
  exportPVDeliberation = async (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
    semester: number
  }) => {
    const queryParams = new URLSearchParams(params as any).toString()
    return await HttpService.downloadFile(`${this.baseUrl}/decisions/export-pv-deliberation?${queryParams}`)
  }

  // Décisions - Exporter récap notes
  exportRecapNotes = async (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
    semester: number
  }) => {
    const queryParams = new URLSearchParams(params as any).toString()
    return await HttpService.downloadFile(`${this.baseUrl}/decisions/export-recap-notes?${queryParams}`)
  }

  // Décisions - Sauvegarder décisions semestrielles
  saveSemesterDecisions = async (params: {
    academic_year_id: number
    semester: number
    decisions: Array<{
      student_id: number
      decision: string
    }>
  }) => {
    return await HttpService.post(`${this.baseUrl}/decisions/save-semester-decisions`, params)
  }

  // Décisions - Sauvegarder décisions annuelles
  saveYearDecisions = async (params: {
    academic_year_id: number
    decisions: Array<{
      student_id: number
      decision: string
    }>
  }) => {
    return await HttpService.post(`${this.baseUrl}/decisions/save-year-decisions`, params)
  }

  // Décisions - Récupérer étudiants par semestre
  getStudentsBySemester = async (params: {
    academic_year_id: number
    department_id: number
    level: string
    cohort: string
    semester: number
  }) => {
    const queryParams = new URLSearchParams(params as any).toString()
    return await HttpService.get(`${this.baseUrl}/decisions/students-by-semester?${queryParams}`)
  }

  // Décisions - Récupérer étudiants par année
  getStudentsByYear = async (params: {
    academic_year_id: number
    department_id: number
    level: string
    cohort: string
  }) => {
    const queryParams = new URLSearchParams(params as any).toString()
    return await HttpService.get(`${this.baseUrl}/decisions/students-by-year?${queryParams}`)
  }

  // Filtres - Récupérer les filières (depuis module Inscription)
  getDepartments = async () => {
    return await HttpService.get('inscription/filieres')
  }

  // Filtres - Récupérer les cohortes (depuis module Inscription)
  getCohorts = async () => {
    return await HttpService.get('inscription/cohortes')
  }
}

export default new NotesService()