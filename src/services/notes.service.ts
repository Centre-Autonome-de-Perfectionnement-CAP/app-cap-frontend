import HttpService from './http.service'

class NotesService {
  private readonly baseUrl = 'notes'

  getMyClasses = async (params?: {
    academic_year_id?: number
    department_id?: number
    cohort?: string
  }) => {
    const filteredParams: Record<string, string> = {}
    if (params) {
      if (params.academic_year_id) filteredParams.academic_year_id = String(params.academic_year_id)
      if (params.department_id)   filteredParams.department_id   = String(params.department_id)
      if (params.cohort)          filteredParams.cohort           = params.cohort
    }
    const qs = Object.keys(filteredParams).length
      ? `?${new URLSearchParams(filteredParams)}`
      : ''
    return HttpService.get(`${this.baseUrl}/professor/my-classes${qs}`)
  }

  getProgramsByClass = (classGroupId: number) =>
    HttpService.get(`${this.baseUrl}/professor/programs-by-class/${classGroupId}`)

  getGradeSheet = (programUuid: string, cohort?: string) => {
    const qs = cohort ? `?cohort=${cohort}` : ''
    return HttpService.get(`${this.baseUrl}/professor/grade-sheet/${programUuid}${qs}`)
  }

  getStudentsForEvaluation = (programUuid: string, cohort?: string) => {
    const qs = cohort ? `?cohort=${cohort}` : ''
    return HttpService.get(`${this.baseUrl}/professor/students-for-evaluation/${programUuid}${qs}`)
  }

  createEvaluation = (
    programIdOrUuid: number | string,
    notes: Record<number, number>,
    isRetake = false,
  ) =>
    HttpService.post(`${this.baseUrl}/professor/create-evaluation`, {
      program_id: programIdOrUuid,
      notes,
      is_retake: isRetake,
    })

  updateGrade = (data: {
    student_pending_student_id: number
    program_id: string | number
    position: number
    value: number
  }) => HttpService.put(`${this.baseUrl}/professor/update-grade`, data)

  setWeighting = (programId: string | number, weighting: number[]) =>
    HttpService.put(`${this.baseUrl}/professor/set-weighting`, {
      program_id: programId,
      weighting,
    })

  duplicateGrade = (programId: string | number, columnIndex: number, sessionNormale = true) =>
    HttpService.put(`${this.baseUrl}/professor/duplicate-grade`, {
      program_id: programId,
      column_index: columnIndex,
      session_normale: sessionNormale,
    })

  deleteEvaluation = (programId: string | number, columnIndex: number, sessionNormale = true) =>
    HttpService.post(`${this.baseUrl}/professor/delete-evaluation`, {
      program_id: programId,
      column_index: columnIndex,
      session_normale: sessionNormale,
    })

  exportGradeSheet = (programUuid: string, includeRetake = false, cohort?: string) => {
    const params = new URLSearchParams()
    if (includeRetake) params.append('include_retake', 'true')
    if (cohort)        params.append('cohort', cohort)
    const qs = params.toString() ? `?${params}` : ''
    return HttpService.downloadFile(`${this.baseUrl}/professor/export-grade-sheet/${programUuid}${qs}`)
  }

  // ─────────────────────────────────────────────────────────────────
  // PROFESSEUR — Cahier de texte
  // ─────────────────────────────────────────────────────────────────

  /** Statistiques globales (toutes entrées du prof) */
  getTextbookStats = () =>
    HttpService.get(`${this.baseUrl}/professor/textbook/stats`)

  /** Liste des programmes du prof pour le <select> */
  getTextbookPrograms = (academicYearId?: number) => {
    const qs = academicYearId ? `?academic_year_id=${academicYearId}` : ''
    return HttpService.get(`${this.baseUrl}/professor/textbook/programs${qs}`)
  }

  /** Historique des entrées d'un programme */
  getTextbookEntries = (programId: number) =>
    HttpService.get(`${this.baseUrl}/professor/textbook/${programId}/entries`)

  publishTextbookEntry = (entryId: number) =>
    HttpService.put(`${this.baseUrl}/professor/textbook/entries/${entryId}/publish`, {})

  /** Dépublier une entrée (published → draft) */
  unpublishTextbookEntry = (entryId: number) =>
    HttpService.put(`${this.baseUrl}/professor/textbook/entries/${entryId}/unpublish`, {})

  // ─────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────

  getDashboard = (academicYearId?: number) => {
    const qs = academicYearId ? `?academic_year_id=${academicYearId}` : ''
    return HttpService.get(`${this.baseUrl}/admin/dashboard${qs}`)
  }

  getGradesByDepartmentLevel = (params: {
    academic_year_id?: number
    department_id?: number
    level?: string
    program_id?: number
    cohort?: string
  }) => {
    const qs = `?${new URLSearchParams(params as Record<string, string>)}`
    return HttpService.get(`${this.baseUrl}/admin/grades-by-department-level${qs}`)
  }

  getProgramDetails = (programId: number) =>
    HttpService.get(`${this.baseUrl}/admin/program-details/${programId}`)

  exportGradesByDepartment = (params: {
    academic_year_id: number
    department_id: number
    level?: string
    format?: 'pdf' | 'excel'
  }) => HttpService.post(`${this.baseUrl}/admin/export-grades-by-department`, params)

  // ─────────────────────────────────────────────────────────────────
  // DÉCISIONS
  // ─────────────────────────────────────────────────────────────────

  exportPVFinAnnee = (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
  }) =>
    HttpService.downloadFile(
      `${this.baseUrl}/decisions/export-pv-fin-annee?${new URLSearchParams(params as Record<string, string>)}`,
    )

  exportPVDeliberation = (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
    semester: number
  }) =>
    HttpService.downloadFile(
      `${this.baseUrl}/decisions/export-pv-deliberation?${new URLSearchParams(params as Record<string, string>)}`,
    )

  exportRecapNotes = (params: {
    academic_year_id: number
    department_id: number
    level?: string
    cohort?: string
    semester: number
  }) =>
    HttpService.downloadFile(
      `${this.baseUrl}/decisions/export-recap-notes?${new URLSearchParams(params as Record<string, string>)}`,
    )

  saveSemesterDecisions = (params: {
    academic_year_id: number
    semester: number
    decisions: Array<{ student_id: number; decision: string }>
  }) => HttpService.post(`${this.baseUrl}/decisions/save-semester-decisions`, params)

  saveYearDecisions = (params: {
    academic_year_id: number
    decisions: Array<{ student_id: number; decision: string }>
  }) => HttpService.post(`${this.baseUrl}/decisions/save-year-decisions`, params)

  getStudentsBySemester = (params: {
    academic_year_id: number
    department_id: number
    level: string
    cohort: string
    semester: number
  }) =>
    HttpService.get(
      `${this.baseUrl}/decisions/students-by-semester?${new URLSearchParams(params as Record<string, string>)}`,
    )

  getStudentsByYear = (params: {
    academic_year_id: number
    department_id: number
    level: string
    cohort: string
  }) =>
    HttpService.get(
      `${this.baseUrl}/decisions/students-by-year?${new URLSearchParams(params as Record<string, string>)}`,
    )

  // ─────────────────────────────────────────────────────────────────
  // FILTRES communs
  // ─────────────────────────────────────────────────────────────────

  getDepartments = () => HttpService.get('inscription/filieres')
  getCohorts     = () => HttpService.get('inscription/cohortes')
}

export default new NotesService()