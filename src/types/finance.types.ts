/**
 * Types pour le module Finance
 * Alignés avec le backend Laravel
 */

export interface Paiement {
  id: number;
  matricule: string;
  montant: number;
  reference: string;
  numero_compte: string;
  date_versement: string;
  motif: string;
  email?: string;
  contact?: string;
  statut: 'attente' | 'accepte' | 'rejete';
  quittance_url?: string;
  commentaire?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreatePaiementData {
  matricule: string;
  montant: number;
  reference: string;
  numero_compte: string;
  date_versement: string;
  quittance: File;
  motif: string;
  email?: string;
  contact?: string;
}

export interface PaiementFilters {
  search?: string;
  statut?: 'attente' | 'accepte' | 'rejete';
  matricule?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

export interface PaiementMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaiementsResponse {
  data: Paiement[];
  meta: PaiementMeta;
}

export interface StudentInfo {
  matricule: string;
  nom: string;
  prenom: string;
  email?: string;
  filiere?: string;
  niveau?: string;
}

export interface Quittance {
  id: number;
  paiement_id: number;
  numero_quittance: string;
  fichier?: string;
  statut: 'soumis' | 'verifie' | 'valide' | 'rejete';
  motif_rejet?: string;
  date_soumission: string;
  date_verification?: string;
  created_at?: string;
  updated_at?: string;
  paiement?: Paiement;
}

export interface TarifScolarite {
  id: number;
  specialite_id: number;
  niveau_id: number;
  annee_academique_id: number;
  montant_inscription: number;
  montant_scolarite: number;
  montant_total: number;
  devise: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompteEtudiant {
  etudiant_id: number;
  montant_total_du: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'a_jour' | 'en_retard' | 'dette';
  paiements: Paiement[];
}

export interface StatistiquesFinance {
  total_collecte: number;
  total_attendu: number;
  taux_recouvrement: number;
  nombre_paiements: number;
  paiements_en_attente: number;
  par_type_paiement?: Record<string, number>;
  par_mois?: Record<string, number>;
}
