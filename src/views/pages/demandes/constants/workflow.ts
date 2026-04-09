// src/views/pages/demandes/constants/workflow.ts
// ─── Source unique de vérité : couleurs, onglets, labels ─────────────────────

import {
  cilInbox, cilEnvelopeLetter, cilUser, cilDollar,
  cilPen, cilTask, cilCheckAlt, cilWarning, cilFolder, cilBan,
} from '@coreui/icons'

// ─── Palette sémantique ───────────────────────────────────────────────────────
// Chaque statut a une couleur de texte lumineuse + un fond pastel doux.
// Règle absolue : jamais de texte foncé sur fond foncé, jamais de noir sur rouge.

export const STATUS_COLORS: Record<string, { color: string; bg: string; text: string }> = {
  pending:                  { color: '#d97706', bg: '#fffbeb', text: '#92400e' },  // Ambre
  secretaire_review:        { color: '#2563eb', bg: '#eff6ff', text: '#1e40af' },  // Bleu
  chef_division_review:     { color: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95' },  // Violet
  comptable_review:         { color: '#0891b2', bg: '#ecfeff', text: '#164e63' },  // Cyan
  chef_cap_review:          { color: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e' },  // Bleu ciel
  directeur_adjoint_review: { color: '#6d28d9', bg: '#f5f3ff', text: '#3b0764' },  // Violet profond
  directeur_review:         { color: '#b91c1c', bg: '#fff1f2', text: '#7f1d1d' },  // Rouge
  ready:                    { color: '#059669', bg: '#ecfdf5', text: '#064e3b' },  // Vert émeraude
  secretaire_correction:    { color: '#dc2626', bg: '#fef2f2', text: '#7f1d1d' },  // Rouge correction
  delivered:                { color: '#4b5563', bg: '#f9fafb', text: '#1f2937' },  // Gris neutre
  rejected:                 { color: '#be123c', bg: '#fff1f2', text: '#881337' },  // Rose carmin
}

// ─── Configuration des onglets secrétaire ─────────────────────────────────────

export interface TabConfig {
  key: string
  label: string
  icon: object
}

export const SECRETAIRE_TABS: TabConfig[] = [
  { key: 'pending',                  label: 'Nouvelles',            icon: cilInbox          },
  { key: 'secretaire_review',        label: 'En cours',             icon: cilEnvelopeLetter },
  { key: 'chef_division_review',     label: 'Resp. Division',       icon: cilUser           },
  { key: 'comptable_review',         label: 'Comptabilité',         icon: cilDollar         },
  { key: 'chef_cap_review',          label: 'Chef CAP',             icon: cilPen            },
  { key: 'directeur_adjoint_review', label: 'Dir. Adjoint',         icon: cilTask           },
  { key: 'directeur_review',         label: 'Directeur',            icon: cilTask           },
  { key: 'ready',                    label: 'Prêts',                icon: cilCheckAlt       },
  { key: 'secretaire_correction',    label: 'À corriger',           icon: cilWarning        },
  { key: 'delivered',                label: 'Archivés',             icon: cilFolder         },
  { key: 'rejected',                 label: 'Rejetés',              icon: cilBan            },
]

export const SECRETAIRE_STAT_TABS = [
  { key: 'pending',               label: 'Nouvelles demandes' },
  { key: 'secretaire_correction', label: 'À corriger'         },
  { key: 'ready',                 label: 'Prêts à retirer'    },
  { key: 'delivered',             label: 'Archivés'           },
]
