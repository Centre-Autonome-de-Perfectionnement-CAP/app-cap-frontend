export interface ClassGroup {
  id: number
  group_name: string | null
  study_level: string | number
  filiere: string
  cycle?: string
  total_etudiants: number
  academic_year_id: number
  academic_year_name: string
  validation_average?: number | string
}

export interface ClassByYear {
  academic_year_id: number
  academic_year_name: string
  classes: ClassGroup[]
}

export interface StudentRow {
  id: number
  matricule?: string
  nomPrenoms: string
  email: string
  sexe: string
  redoublant: string
  telephone?: string
  date_naissance?: string
  lieu_naissance?: string
}