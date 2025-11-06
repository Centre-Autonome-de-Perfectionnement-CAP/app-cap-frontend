/**
 * Types pour le module Inscription
 */

export interface AnneeAcademique {
  id: number;
  annee: string;
  date_debut: string;
  date_fin: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cycle {
  id: number;
  nom: string;
  description?: string;
  duree_annees: number;
  created_at?: string;
  updated_at?: string;
}

export interface Specialite {
  id: number;
  nom: string;
  code?: string;
  cycle_id: number;
  cycle?: Cycle;
  created_at?: string;
  updated_at?: string;
}

export interface Niveau {
  id: number;
  nom: string;
  ordre: number;
  cycle_id: number;
  cycle?: Cycle;
  created_at?: string;
  updated_at?: string;
}

export interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email: string;
  telephone?: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: 'M' | 'F';
  nationalite?: string;
  adresse?: string;
  photo?: string;
  specialite_id?: number;
  niveau_id?: number;
  annee_academique_id?: number;
  statut: 'actif' | 'inactif' | 'suspendu' | 'diplome';
  specialite?: Specialite;
  niveau?: Niveau;
  annee_academique?: AnneeAcademique;
  created_at?: string;
  updated_at?: string;
}

export interface PendingStudent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe: 'M' | 'F';
  nationalite?: string;
  specialite_demandee_id?: number;
  niveau_demande_id?: number;
  statut: 'en_attente' | 'accepte' | 'refuse';
  numero_dossier?: string;
  documents?: any[];
  opinionCuca?: string;
  commentaireCuca?: string;
  opinionCuo?: string;
  commentaireCuo?: string;
  created_at?: string;
  updated_at?: string;
}

// Dashboard Stats (retourné par DashboardService.php)
export interface DashboardStats {
  inscritsCap: number;
  dossiersAttente: number;
  anneeAcademique: string;
  nombreFilieres: number;
  nombreCycles: number;
}

// Graph Data (retourné par DashboardService.php)
export interface GraphesData {
  inscritsParFiliere: Array<{ filiere: string; nombre: number }>;
  inscritsParCycle: Array<{ cycle: string; nombre: number }>;
  dossiersParStatut: Array<{ statut: string; nombre: number }>;
  anneeAcademique: string;
}

// Academic Year (retourné par AcademicYearResource.php)
export interface AcademicYear {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
}

// Pending Student (retourné par PendingStudentResource.php)
export interface PendingStudentData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: string;
  status: 'pending' | 'documents_submitted' | 'approved' | 'rejected';
  submitted_at: string;
  department: string;
  entry_diploma?: {
    id: number;
    name: string;
    abbreviation: string;
    entry_level: string;
  };
  student_pending_students?: any[];
  files?: Array<{
    id: number;
    name: string;
    path: string;
    mime_type: string;
    size: number;
  }>;
  pieces?: Array<{
    name?: string;
    url?: string;
  }>;
  opinionCuca?: string;
  commentaireCuca?: string;
  opinionCuo?: string;
  commentaireCuo?: string;
  mailCucaEnvoye?: string;
  mailCuoEnvoye?: string;
  mailCucaCount?: number;
  mailCuoCount?: number;
  exonere?: string;
  sponsorise?: string;
}

// Period (période d'inscription)
export interface Period {
  type: 'depot' | 'reclamation';
  start: string;
  end: string;
  filieres: string[];
}

// Student list item (returned by students list API)
export interface StudentListItem {
  id: number;
  matricule: string;
  nomPrenoms: string;
  sexe: string;
  redoublant: string;
  dateNaissance: string;
  groupe?: string;
}

// Student details (returned by student details API)
export interface StudentDetails extends StudentListItem {
  filiere: string;
  niveau: string;
  annee: string;
  entryDiploma: string;
  statut: string;
  email: string;
  telephone: string;
  photo?: string;
}

// Filter option item (can be string or object with id and libelle/name/title)
export interface FilterOptionItem {
  id?: number | string;
  libelle?: string;  // Used by academic years
  name?: string;     // Used by departments/diplomas
  title?: string;    // Alternative name field
}

// Filter options (returned by filter options API)
export interface FilterOptions {
  years: Array<string | FilterOptionItem>;
  filieres: Array<string | FilterOptionItem>;
  entryDiplomas: Array<string | FilterOptionItem>;
  redoublants: string[];
  niveaux: Record<string, Array<string | FilterOptionItem>>;
}
