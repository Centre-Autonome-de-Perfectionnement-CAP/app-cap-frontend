export interface Presence {
  id: number
  nom: string
  matricule: string
  check_in: string
  check_out: string
  duree: string
  statut: string
}

export interface Absence {
  id: number
  nom: string
  matricule: string
  date: string
}
export interface Student {
  id: number
  first_name: string
  last_name: string
  filiere: string
}
