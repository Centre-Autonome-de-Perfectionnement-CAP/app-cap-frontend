// src/views/pages/demandes/constants/workflow.ts

import {
  cilInbox, cilDollar, cilUser, cilPen, cilTask,
  cilCheckAlt, cilWarning, cilFolder, cilBan, cilFlagAlt,  // ← cilFlagAlt ajouté
} from '@coreui/icons'

export const STATUS_COLORS: Record<string, { color: string; bg: string; text: string }> = {
  pending: { color: '#d97706', bg: '#fffbeb', text: '#92400e' },
  secretaire_correction: { color: '#dc2626', bg: '#fef2f2', text: '#7f1d1d' },
  comptable_review: { color: '#0891b2', bg: '#ecfeff', text: '#164e63' },
  chef_division_review: { color: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95' },
  chef_cap_review: { color: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e' },
  sec_dir_adjointe_review: { color: '#9333ea', bg: '#faf5ff', text: '#581c87' },
  directrice_adjointe_review: { color: '#6d28d9', bg: '#f5f3ff', text: '#3b0764' },
  sec_directeur_review: { color: '#c2410c', bg: '#fff7ed', text: '#7c2d12' },
  directeur_review: { color: '#15803d', bg: '#f0fdf4', text: '#14532d' },
  ready: { color: '#059669', bg: '#ecfdf5', text: '#064e3b' },
  delivered: { color: '#4b5563', bg: '#f9fafb', text: '#1f2937' },
  rejected: { color: '#be123c', bg: '#fff1f2', text: '#881337' },
  flagged: { color: '#d97706', bg: '#fffbeb', text: '#92400e' },
}

export interface TabConfig { key: string; label: string; icon: object }
export interface StatConfig { key: string; label: string; color?: string; bg?: string; urgent?: boolean; icon?: React.ReactNode; onClick?: () => void }

export const SECRETAIRE_TABS: TabConfig[] = [
  { key: 'pending', label: 'Nouvelles', icon: cilInbox },
  { key: 'comptable_review', label: 'Comptabilité', icon: cilDollar },
  { key: 'chef_division_review', label: 'Resp. Division', icon: cilUser },
  { key: 'chef_cap_review', label: 'Chef CAP', icon: cilPen },
  { key: 'sec_dir_adjointe_review', label: 'Sec. Dir. Adj.', icon: cilTask },
  { key: 'directrice_adjointe_review', label: 'Dir. Adjointe', icon: cilTask },
  { key: 'sec_directeur_review', label: 'Sec. Directeur', icon: cilTask },
  { key: 'directeur_review', label: 'Directeur', icon: cilTask },
  { key: 'ready', label: 'Prêts', icon: cilCheckAlt },
  { key: 'secretaire_correction', label: 'À corriger', icon: cilWarning },
  { key: 'flagged', label: '⚑ Réserves', icon: cilFlagAlt }, // ← AJOUT
  { key: 'delivered', label: 'Archivés', icon: cilFolder },
  { key: 'rejected', label: 'Rejetés', icon: cilBan },
]

// Stat cards secrétaire :
// - secretaire_correction et flagged sont urgent=true : pulse quand count > 0
export const SECRETAIRE_STAT_TABS: Omit<StatConfig, 'onClick'>[] = [
  { key: 'pending', label: 'Nouvelles demandes' },
  { key: 'secretaire_correction', label: 'À corriger', urgent: true },
  { key: 'flagged', label: 'Réserves actives', urgent: true },
  { key: 'ready', label: 'Prêts à retirer' },
  { key: 'delivered', label: 'Archivés' },
]
