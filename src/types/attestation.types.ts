export interface EligibleStudent {
  id: number
  student_pending_student_id: number
  student_id: string
  last_name: string
  first_names: string
  department: string
  study_level: string
  cohort: string
  year_decision: string
  academic_year: string
}

export interface AttestationFilters {
  academic_year_id?: number
  department_id?: number
  cohort?: string
  search?: string
}
