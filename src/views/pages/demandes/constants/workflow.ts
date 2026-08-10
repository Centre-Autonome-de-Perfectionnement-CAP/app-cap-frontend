// src/views/pages/demandes/constants/workflow.ts

import {
  cilInbox, cilDollar, cilUser, cilPen, cilTask,
  cilCheckAlt, cilWarning, cilFolder, cilBan, cilFlagAlt, cilSync,
} from '@coreui/icons'

export const STATUS_COLORS: Record<string, { color: string; bg: string; text: string }> = {
  submitted:                    { color: '#d97706', bg: '#fffbeb', text: '#92400e' },
  secretary_correction:         { color: '#dc2626', bg: '#fef2f2', text: '#7f1d1d' },
  accounting_review:            { color: '#0891b2', bg: '#ecfeff', text: '#164e63' },
  division_manager_review:      { color: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95' },
  cap_manager_review:           { color: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e' },
  deputy_director_secretary_review: { color: '#9333ea', bg: '#faf5ff', text: '#581c87' },
  deputy_director_review:       { color: '#6d28d9', bg: '#f5f3ff', text: '#3b0764' },
  director_secretary_review:    { color: '#c2410c', bg: '#fff7ed', text: '#7c2d12' },
  director_review:              { color: '#15803d', bg: '#f0fdf4', text: '#14532d' },
  secretary_final_review:       { color: '#0d9488', bg: '#f0fdfa', text: '#134e4a' },
  ready_for_pickup:             { color: '#059669', bg: '#ecfdf5', text: '#064e3b' },
  picked_up:                    { color: '#4b5563', bg: '#f9fafb', text: '#1f2937' },
  rejected:                     { color: '#be123c', bg: '#fff1f2', text: '#881337' },
  flagged:                      { color: '#d97706', bg: '#fffbeb', text: '#92400e' },
  // Onglet synthétique : dossiers en circuit actif chez un acteur (status ≠ secretary_correction)
  circuit_correction:           { color: '#ea580c', bg: '#fff7ed', text: '#7c2d12' },
}

export interface TabConfig { key: string; label: string; icon: string | string[] }
export interface StatConfig { key: string; label: string; color?: string; bg?: string; urgent?: boolean; icon?: React.ReactNode; onClick?: () => void }

export const SECRETAIRE_TABS: TabConfig[] = [
  { key: 'submitted',                  label: 'Nouvelles',        icon: cilInbox    },
  { key: 'accounting_review',          label: 'Comptabilité',     icon: cilDollar   },
  { key: 'division_manager_review',    label: 'Resp. Division',   icon: cilUser     },
  { key: 'cap_manager_review',         label: 'Chef CAP',         icon: cilPen      },
  { key: 'deputy_director_secretary_review', label: 'Sec. Dir. Adj.',   icon: cilTask     },
  { key: 'deputy_director_review',     label: 'Dir. Adjointe',    icon: cilTask     },
  { key: 'director_secretary_review',  label: 'Sec. Directeur',   icon: cilTask     },
  { key: 'director_review',            label: 'Directeur',        icon: cilTask     },
  { key: 'secretary_final_review',     label: 'À finaliser',      icon: cilCheckAlt },
  { key: 'ready_for_pickup',           label: 'Prêts',            icon: cilCheckAlt },
  { key: 'secretary_correction',       label: 'À corriger',       icon: cilWarning  },
  { key: 'circuit_correction',         label: 'Navette active',   icon: cilSync     },
  { key: 'flagged',                    label: 'Réserves',         icon: cilFlagAlt  },
  { key: 'picked_up',                  label: 'Archivés',         icon: cilFolder   },
  { key: 'rejected',                   label: 'Rejetés',          icon: cilBan      },
]

// Stat cards secrétaire :
// - secretary_correction, circuit_correction, flagged et secretary_final_review sont urgent=true
export const SECRETAIRE_STAT_TABS: Omit<StatConfig, 'onClick'>[] = [
  { key: 'submitted',              label: 'Nouvelles demandes' },
  { key: 'secretary_final_review', label: 'À finaliser',       urgent: true },
  { key: 'secretary_correction',   label: 'À corriger',        urgent: true },
  { key: 'circuit_correction',     label: 'Navette active',    urgent: true },
  { key: 'flagged',                label: 'Réserves actives',  urgent: true },
  { key: 'ready_for_pickup',       label: 'Prêts à retirer' },
  { key: 'picked_up',              label: 'Archivés' },
]
