// src/views/pages/demandes/components/modal/DemandeModalShell.tsx

import { useState } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilDescription, cilHistory, cilWarning, cilFolderOpen,
} from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import DocumentExplorerModal from '@/components/document-request/DocumentExplorerModal'
import type { DocumentRequest } from '@/types/document-request.types'
import { RESPONSABLE_DIVISION_LABELS } from '@/types/document-request.types'
import HistoriquePanel from './HistoriquePanel'
import SousReservePanel from './SousReservePanel'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'reserve' | 'historique'

interface Props {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer: React.ReactNode
  showStatusBadge?: boolean
  canClearFlag?: boolean
  onFlagCleared?: () => void
  onRefresh?: () => Promise<void>
}

// ─── Workflow progress bar ──────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  { key: 'submitted',                        label: 'Soumis'         },
  { key: 'accounting_review',                label: 'Comptabilité'   },
  { key: 'division_manager_review',          label: 'Resp. Division' },
  { key: 'cap_manager_review',               label: 'Chef CAP'       },
  { key: 'deputy_director_secretary_review', label: 'Sec. Dir. Adj.' },
  { key: 'deputy_director_review',           label: 'Dir. Adjointe'  },
  { key: 'director_secretary_review',        label: 'Sec. Directeur' },
  { key: 'director_review',                  label: 'Directeur'      },
  { key: 'ready_for_pickup',                 label: 'Prêt'           },
  { key: 'picked_up',                        label: 'Remis'          },
]

const WorkflowProgress = ({ status }: { status: string }) => {
  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.key === status)
  const isRejected = status === 'rejected' || status === 'secretary_correction'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      overflowX: 'auto', paddingBottom: 4,
      scrollbarWidth: 'none',
    }}>
      {WORKFLOW_STEPS.map((step, idx) => {
        const done    = currentIdx > idx
        const current = currentIdx === idx
        const future  = currentIdx < idx

        const color = isRejected && current
          ? '#dc2626'
          : current ? '#2563eb'
          : done    ? '#059669'
          : '#d1d5db'

        const bg = isRejected && current
          ? '#fef2f2'
          : current ? '#eff6ff'
          : done    ? '#ecfdf5'
          : '#f9fafb'

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: bg,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800,
                color,
                boxShadow: current ? `0 0 0 3px ${color}22` : 'none',
                transition: 'all 0.2s',
              }}>
                {done ? '✓' : isRejected && current ? '✕' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.62rem', fontWeight: current ? 700 : 500,
                color: current ? color : future ? '#9ca3af' : '#6b7280',
                whiteSpace: 'nowrap', maxWidth: 56, textAlign: 'center', lineHeight: 1.2,
              }}>
                {step.label}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div style={{
                width: 18, height: 2, flexShrink: 0,
                background: done ? '#059669' : '#e5e7eb',
                margin: '0 1px', marginBottom: 16,
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Bouton onglet ──────────────────────────────────────────────────────────────

const TabBtn = ({
  label, active, onClick, icon, dot, highlight,
}: {
  label: string; active: boolean; onClick: () => void
  icon: any; dot?: boolean; highlight?: boolean
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '10px 16px',
      borderRadius: '8px 8px 0 0',
      border: 'none',
      borderBottom: active
        ? `2px solid ${highlight ? '#d97706' : '#2563eb'}`
        : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.875rem',
      color: active
        ? (highlight ? '#d97706' : '#2563eb')
        : '#6b7280',
      background: active
        ? (highlight ? '#fffbeb' : '#f8faff')
        : 'transparent',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    <CIcon icon={icon} style={{ width: 14, flexShrink: 0 }} />
    {label}
    {dot && (
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#d97706', flexShrink: 0,
        display: 'inline-block',
      }} />
    )}
  </button>
)

// ─── Comptage des fichiers ──────────────────────────────────────────────────────

function countFiles(demande: DocumentRequest): number {
  let count = 0

  const countKV = (raw: any) => {
    if (!raw) return
    let parsed = raw
    if (typeof raw === 'string') { try { parsed = JSON.parse(raw) } catch { return } }
    if (typeof parsed === 'object' && !Array.isArray(parsed)) count += Object.keys(parsed).length
    else if (Array.isArray(parsed)) count += parsed.length
  }

  countKV(demande.files)
  countKV(demande.complement_files)

  if (demande.secretary_files) {
    let sf = demande.secretary_files as any
    if (typeof sf === 'string') { try { sf = JSON.parse(sf) } catch { sf = [] } }
    if (Array.isArray(sf)) count += sf.length
  }

  return count
}

// ─── Shell principal ────────────────────────────────────────────────────────────

const DemandeModalShell = ({
  demande, visible, onClose,
  title, children, footer,
  showStatusBadge = true,
  canClearFlag = false,
  onFlagCleared,
  onRefresh,
}: Props) => {
  const hasFlag = !!(demande as any).has_flag
  const [activeTab, setActiveTab]     = useState<Tab>('details')
  const [explorerOpen, setExplorerOpen] = useState(false)
  const fileCount = countFiles(demande)

  const handleClose = () => {
    setActiveTab('details')
    setExplorerOpen(false)
    onClose()
  }

  return (
    <>
      {/* ── Explorateur de documents ── */}
      <DocumentExplorerModal
        demande={demande}
        visible={explorerOpen}
        onClose={() => setExplorerOpen(false)}
      />

      {/* ── Modal principal ── */}
      <CModal visible={visible} onClose={handleClose} size="xl" alignment="center" scrollable>

        {/* ── Header ── */}
        <CModalHeader style={{
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px 0',
          background: '#fff',
        }}>
          <div style={{ width: '100%' }}>

            {/* Titre + badges */}
            <CModalTitle style={{
              display: 'flex', alignItems: 'center', gap: 8,
              flexWrap: 'wrap', marginBottom: 10,
            }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                {title ?? 'Dossier'}
              </span>
              <code style={{
                fontSize: '0.82rem', color: '#64748b', fontWeight: 600,
                background: '#f1f5f9', padding: '2px 8px', borderRadius: 5,
              }}>
                #{demande.reference}
              </code>
              {showStatusBadge && <WorkflowBadge status={demande.status} size="sm" />}
              {demande.responsable_division_type && (
                <span style={{
                  fontSize: '0.75rem', padding: '2px 8px', borderRadius: 5,
                  background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
                }}>
                  {RESPONSABLE_DIVISION_LABELS[demande.responsable_division_type]}
                </span>
              )}
              {hasFlag && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: '0.75rem', padding: '3px 8px', borderRadius: 5,
                  background: '#fffbeb', color: '#d97706', fontWeight: 700,
                  border: '1px solid #fcd34d',
                }}>
                  <CIcon icon={cilWarning} style={{ width: 12 }} />
                  Réserve active
                </span>
              )}
            </CModalTitle>

            {/* Barre de progression workflow */}
            <div style={{ marginBottom: 10 }}>
              <WorkflowProgress status={demande.status} />
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e2e8f0', marginBottom: -1 }}>
              <TabBtn
                label="Détails"
                icon={cilDescription}
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
              />
              {hasFlag && (
                <TabBtn
                  label="Sous réserve"
                  icon={cilWarning}
                  active={activeTab === 'reserve'}
                  onClick={() => setActiveTab('reserve')}
                  dot
                  highlight
                />
              )}
              <TabBtn
                label="Historique"
                icon={cilHistory}
                active={activeTab === 'historique'}
                onClick={() => setActiveTab('historique')}
              />
            </div>
          </div>
        </CModalHeader>

        {/* ── Body ── */}
        <CModalBody style={{ padding: '24px 28px', minHeight: 320 }}>
          {activeTab === 'details' && children}

          {activeTab === 'reserve' && hasFlag && (
            <SousReservePanel
              demande={demande}
              canClearFlag={canClearFlag}
              onFlagCleared={() => {
                onFlagCleared?.()
                setActiveTab('details')
              }}
            />
          )}

          {activeTab === 'historique' && (
            <HistoriquePanel
              demandeId={demande.id}
              hasFlag={false}
              canClearFlag={false}
            />
          )}
        </CModalBody>

        {/* ── Footer ── */}
        <CModalFooter style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex', flexWrap: 'wrap', gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>

          {/* Bouton Explorer les documents — côté gauche */}
          <button
            onClick={() => setExplorerOpen(true)}
            disabled={fileCount === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: fileCount === 0 ? '#f1f5f9' : '#fff',
              color: fileCount === 0 ? '#94a3b8' : '#2563eb',
              border: fileCount === 0 ? '1.5px solid #e2e8f0' : '1.5px solid #bfdbfe',
              borderRadius: 10,
              fontWeight: 700, fontSize: '0.875rem',
              cursor: fileCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => {
              if (fileCount === 0) return
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#eff6ff'
              el.style.borderColor = '#2563eb'
              el.style.boxShadow = '0 2px 10px rgba(37,99,235,0.15)'
            }}
            onMouseLeave={e => {
              if (fileCount === 0) return
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#fff'
              el.style.borderColor = '#bfdbfe'
              el.style.boxShadow = 'none'
            }}
          >
            <CIcon icon={cilFolderOpen} style={{ width: 16, flexShrink: 0 }} />
            Explorer les documents
            {fileCount > 0 && (
              <span style={{
                background: '#dbeafe',
                color: '#1d4ed8',
                borderRadius: 20, padding: '1px 8px',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {fileCount}
              </span>
            )}
          </button>

          {/* Actions métier — côté droit */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {footer}
          </div>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default DemandeModalShell
