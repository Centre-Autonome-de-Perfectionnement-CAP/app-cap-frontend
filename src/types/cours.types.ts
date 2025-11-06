/**
 * Types pour les modules Cours, Notes et Présence
 */

export interface Matiere {
  id: number;
  nom: string;
  code?: string;
  coefficient: number;
  credits?: number;
  specialite_id?: number;
  niveau_id?: number;
  semestre?: 1 | 2;
  type?: 'theorique' | 'pratique' | 'td' | 'tp';
  created_at?: string;
  updated_at?: string;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email: string;
  telephone?: string;
  specialite?: string;
  grade?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Cours {
  id: number;
  matiere_id: number;
  enseignant_id: number;
  classe_id?: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string;
  type: 'cours' | 'td' | 'tp';
  matiere?: Matiere;
  enseignant?: Enseignant;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: number;
  etudiant_id: number;
  matiere_id: number;
  type_evaluation: 'cc' | 'examen' | 'tp' | 'projet';
  note: number;
  note_sur: number;
  coefficient?: number;
  semestre: 1 | 2;
  annee_academique_id: number;
  observation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Bulletin {
  etudiant_id: number;
  etudiant?: any;
  semestre: 1 | 2;
  annee_academique_id: number;
  notes: Note[];
  moyenne_generale: number;
  total_coefficients: number;
  rang?: number;
  effectif_classe?: number;
  mention?: string;
  decision?: 'ADMIS' | 'AJOURNÉ' | 'REDOUBLE';
  appreciation?: string;
}

export interface Presence {
  id: number;
  etudiant_id: number;
  cours_id: number;
  date: string;
  statut: 'present' | 'absent' | 'retard' | 'justifie';
  observation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeancePresence {
  cours_id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  presences: Presence[];
  taux_presence?: number;
}

export interface EmploiDuTemps {
  id: number;
  classe_id?: number;
  specialite_id?: number;
  niveau_id?: number;
  semestre: 1 | 2;
  annee_academique_id: number;
  cours: Cours[];
  created_at?: string;
  updated_at?: string;
}
