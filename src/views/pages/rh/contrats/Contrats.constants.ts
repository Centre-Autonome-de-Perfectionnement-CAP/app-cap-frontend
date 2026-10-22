// src/views/pages/rh/contrats/Contrats.constants.ts
// Extrait tel quel de Contrats.tsx - constantes UI partagées.
import type { ContratStatus } from '@/types/rh.types'

export const DIVISIONS = [
  { value: 'RD-FAD', label: 'RD-FAD - Responsable Division-Formation à Distance' },
  { value: 'RD-FC',  label: 'RD-FC - Responsable Division-Formation Continue' },
];
export const REGROUPEMENTS = [
  { value: '1', label: 'Regroupement I' },
  { value: '2', label: 'Regroupement II' },
];
export const STATUS_OPTIONS: { value: ContratStatus; label: string }[] = [
  { value: 'pending',    label: 'En attente' },
  { value: 'signed',     label: 'Signé' },
  { value: 'ongoing',    label: 'En cours' },
  { value: 'completed',  label: 'Terminé' },
  { value: 'cancelled',  label: 'Résilié' },
  { value: 'transfered', label: 'Transféré' },
];
export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'En attente', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
  signed:     { label: 'Signé',      color: '#065f46', bg: '#f0fdf4', dot: '#10b981' },
  ongoing:    { label: 'En cours',   color: '#1e3a8a', bg: '#eff6ff', dot: '#3b82f6' },
  completed:  { label: 'Terminé',    color: '#374151', bg: '#f9fafb', dot: '#9ca3af' },
  cancelled:  { label: 'Rejeté',     color: '#7f1d1d', bg: '#fef2f2', dot: '#ef4444' },
  transfered: { label: 'Transféré',  color: '#3b0764', bg: '#faf5ff', dot: '#a855f7' },
  resiliated: { label: 'Résilié',     color: '#991b1b', bg: '#fef2f2', dot: '#dc2626' },
};


export const FILTER_DIVISION_OPTS = [
  { value: '', label: 'Toutes les divisions' },
  { value: 'RD-FAD', label: 'RD-FAD' },
  { value: 'RD-FC',  label: 'RD-FC' },
];
export const FILTER_REG_OPTS = [
  { value: '', label: 'Tous' },
  { value: '1', label: 'Regroupement I' },
  { value: '2', label: 'Regroupement II' },
];
export const FILTER_STATUS_OPTS = [
  { value: '', label: 'Tous les statuts' },
  ...STATUS_OPTIONS,
];

