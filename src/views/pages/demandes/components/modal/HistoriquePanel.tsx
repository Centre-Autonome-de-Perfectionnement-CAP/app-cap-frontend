// src/views/pages/demandes/components/modal/HistoriquePanel.tsx
// Gestion du flag retirée : centralisée dans SousReservePanel.
// Texte minimum 14px. Interface allégée.

import { useState, useEffect } from 'react'
import { CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilHistory, cilUser, cilArrowRight } from '@coreui/icons'
import documentRequestService from '@/services/document-request.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number
  actor_name: string
  actor_role: string
  action_type: 'validation' | 'validation_flagged' | 'rejection' | 'resend' | 'delivery' | 'correction' | 'flag_cleared'
  action_label: string
  status_before: string
  status_after: string
  comment: string | null
  created_at: string
  is_own_action: boolean
}

interface HistoriquePanelProps {
  demandeId: number
  // Props conservées pour compatibilité — flag géré dans SousReservePanel
  hasFlag?: boolean
  canClearFlag?: boolean
  onFlagCleared?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  secretaire:           'Secrétaire',
  comptable:            'Comptable',
  chef_division:        'Resp. Division',
  chef_cap:             'Chef CAP',
  sec_dir_adjointe:     'Sec. Dir. Adj.',
  directrice_adjointe:  'Dir. Adjointe',
  sec_directeur:        'Sec. Directeur',
  directeur:            'Directeur',
}

const STATUS_LABELS: Record<string, string> = {
  submitted:                        'En attente',
  accounting_review:                'Comptabilité',
  division_manager_review:          'Resp. Division',
  cap_manager_review:               'Chef CAP',
  deputy_director_secretary_review: 'Sec. Dir. Adj.',
  deputy_director_review:           'Dir. Adjointe',
  director_secretary_review:        'Sec. Directeur',
  director_review:                  'Directeur',
  secretary_correction:             'Correction',
  ready_for_pickup:                 'Prêt',
  picked_up:                        'Remis',
  rejected:                         'Rejeté',
}

const ACTION_META: Record<string, { color: string; bg: string; borderColor: string; label: string }> = {
  validation:         { color: '#059669', bg: '#ecfdf5', borderColor: '#6ee7b7', label: 'Validation'            },
  validation_flagged: { color: '#b45309', bg: '#fffbeb', borderColor: '#fcd34d', label: 'Validation sous réserve' },
  rejection:          { color: '#dc2626', bg: '#fef2f2', borderColor: '#fca5a5', label: 'Rejet'                  },
  resend:             { color: '#2563eb', bg: '#eff6ff', borderColor: '#93c5fd', label: 'Renvoi'                 },
  delivery:           { color: '#7c3aed', bg: '#f5f3ff', borderColor: '#c4b5fd', label: 'Remise'                },
  correction:         { color: '#dc2626', bg: '#fef2f2', borderColor: '#fca5a5', label: 'Correction'            },
  flag_cleared:       { color: '#059669', bg: '#ecfdf5', borderColor: '#6ee7b7', label: 'Réserve levée'         },
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' — '
    + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Ligne historique ─────────────────────────────────────────────────────────

const EntryRow = ({ entry, own }: { entry: HistoryEntry; own?: boolean }) => {
  const meta = ACTION_META[entry.action_type] ?? ACTION_META.validation

  return (
    <div style={{
      display: 'flex', gap: 14,
      padding: '14px 16px',
      borderRadius: 10,
      background: own ? '#f0f7ff' : '#fafafa',
      border: `1px solid ${own ? '#bfdbfe' : '#f1f5f9'}`,
    }}>
      {/* Barre couleur latérale */}
      <div style={{
        width: 3, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
        background: meta.color, opacity: 0.7,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Acteur + action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.875rem', fontWeight: 700, color: '#111827',
          }}>
            <CIcon icon={cilUser} style={{ width: 13, color: '#94a3b8' }} />
            {own ? 'Vous' : entry.actor_name}
          </div>
          <span style={{
            fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4,
            background: '#f1f5f9', color: '#64748b', fontWeight: 500,
          }}>
            {ROLE_LABELS[entry.actor_role] ?? entry.actor_role}
          </span>
          <span style={{
            fontSize: '0.8rem', padding: '2px 10px', borderRadius: 5,
            background: meta.bg, color: meta.color,
            border: `1px solid ${meta.borderColor}`,
            fontWeight: 700,
          }}>
            {entry.action_label || meta.label}
          </span>
        </div>

        {/* Transition statuts */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: entry.comment ? 8 : 0,
        }}>
          <span style={{
            fontSize: '0.78rem', padding: '2px 8px', borderRadius: 4,
            background: '#f1f5f9', color: '#64748b',
          }}>
            {STATUS_LABELS[entry.status_before] ?? entry.status_before}
          </span>
          <CIcon icon={cilArrowRight} style={{ width: 11, color: '#94a3b8', flexShrink: 0 }} />
          <span style={{
            fontSize: '0.78rem', padding: '2px 8px', borderRadius: 4,
            background: meta.bg, color: meta.color, fontWeight: 600,
          }}>
            {STATUS_LABELS[entry.status_after] ?? entry.status_after}
          </span>
        </div>

        {/* Commentaire */}
        {entry.comment && (
          <div style={{
            fontSize: '0.875rem', color: '#374151', lineHeight: 1.55,
            background: entry.action_type === 'validation_flagged' ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${entry.action_type === 'validation_flagged' ? '#fcd34d' : '#e2e8f0'}`,
            borderRadius: 6, padding: '8px 12px', marginTop: 2,
            fontStyle: 'italic',
          }}>
            {entry.comment}
          </div>
        )}
      </div>

      {/* Date */}
      <div style={{
        fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap',
        flexShrink: 0, alignSelf: 'flex-start', paddingTop: 2,
      }}>
        {formatDate(entry.created_at)}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const HistoriquePanel = ({ demandeId }: HistoriquePanelProps) => {
  const [entries,    setEntries]    = useState<HistoryEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [chronoMode, setChronoMode] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    documentRequestService.getHistory(demandeId)
      .then(res => { if (!cancelled) setEntries(res.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [demandeId])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <CSpinner color="primary" style={{ width: 28, height: 28 }} />
      <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: 10 }}>
        Chargement de l'historique…
      </div>
    </div>
  )

  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
      <CIcon icon={cilHistory} style={{ width: 32, color: '#e2e8f0', marginBottom: 10 }} />
      <div style={{ fontSize: '0.875rem' }}>Aucune action enregistrée</div>
    </div>
  )

  const ownEntries   = entries.filter(e => e.is_own_action)
  const otherEntries = entries.filter(e => !e.is_own_action)
  const hasOwn       = ownEntries.length > 0

  return (
    <div>
      {/* Barre de contrôle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {entries.length} action{entries.length > 1 ? 's' : ''} enregistrée{entries.length > 1 ? 's' : ''}
        </span>
        {hasOwn && (
          <button
            onClick={() => setChronoMode(m => !m)}
            style={{
              background: chronoMode ? '#2563eb' : 'transparent',
              border: '1.5px solid #2563eb',
              color: chronoMode ? '#fff' : '#2563eb',
              borderRadius: 6, padding: '4px 12px',
              fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {chronoMode ? 'Mes actions en premier' : 'Tout chronologique'}
          </button>
        )}
      </div>

      {/* Mode chronologique */}
      {(chronoMode || !hasOwn) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(e => <EntryRow key={e.id} entry={e} own={e.is_own_action} />)}
        </div>
      )}

      {/* Mode "mes actions en premier" */}
      {!chronoMode && hasOwn && (
        <>
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: '#1d4ed8', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>Vos actions</span>
              <span style={{ flex: 1, height: 1, background: '#bfdbfe' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ownEntries.map(e => <EntryRow key={e.id} entry={e} own />)}
            </div>
          </div>

          {otherEntries.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: '#64748b', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>Autres acteurs</span>
                <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherEntries.map(e => <EntryRow key={e.id} entry={e} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default HistoriquePanel
