// src/views/pages/demandes/components/modal/DemandeModalShell.tsx
// Modal agrandi et aéré. Onglet Historique actif par défaut.
// Bannière réserve visible dans l'onglet Détails si has_flag.

import { useState } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilHistory, cilWarning } from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { CHEF_DIVISION_LABELS } from '@/types/document-request.types'
import HistoriquePanel from './HistoriquePanel'

type Tab = 'historique' | 'details'

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
}

// ─── Onglet ───────────────────────────────────────────────────────────────────

const TabBtn = ({
  label, active, onClick, icon, dot,
}: {
  label: string; active: boolean; onClick: () => void
  icon: any; dot?: boolean
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 18px',
      borderRadius: '8px 8px 0 0',
      border: 'none',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.84rem',
      color: active ? '#2563eb' : '#6b7280',
      background: active ? '#f8faff' : 'transparent',
      transition: 'all 0.15s',
      position: 'relative',
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

// ─── Bannière réserve ─────────────────────────────────────────────────────────

const FlagBanner = ({ onView }: { onView: () => void }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    background: '#fffbeb', border: '1px solid #fcd34d',
    borderRadius: 8, padding: '10px 16px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <CIcon icon={cilWarning} style={{ width: 16, color: '#d97706', flexShrink: 0 }} />
      <span style={{ fontSize: '0.83rem', color: '#92400e', fontWeight: 500 }}>
        Ce dossier porte une réserve active
      </span>
    </div>
    <button
      onClick={onView}
      style={{
        background: 'none', border: '1.5px solid #d97706',
        color: '#d97706', borderRadius: 6,
        padding: '4px 12px', fontSize: '0.76rem',
        fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#d97706'; b.style.color = '#fff' }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'none'; b.style.color = '#d97706' }}
    >
      Voir la réserve
    </button>
  </div>
)

// ─── Shell ────────────────────────────────────────────────────────────────────

const DemandeModalShell = ({
  demande, visible, onClose,
  title, children, footer,
  showStatusBadge = true,
  canClearFlag = false,
  onFlagCleared,
}: Props) => {
  // Historique par défaut
  const [activeTab, setActiveTab] = useState<Tab>('historique')

  const handleClose = () => {
    setActiveTab('historique')
    onClose()
  }

  const hasFlag = !!(demande as any).has_flag

  return (
    <CModal visible={visible} onClose={handleClose} size="xl" alignment="center" scrollable>
      {/* ── Header ── */}
      <CModalHeader style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 28px 0',
        background: '#fff',
      }}>
        <div style={{ width: '100%' }}>
          {/* Titre */}
          <CModalTitle style={{
            display: 'flex', alignItems: 'center', gap: 10,
            flexWrap: 'wrap', marginBottom: 16,
          }}>
            <span style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              {title ?? 'Dossier'}
            </span>
            <code style={{
              fontSize: '0.84rem', color: '#64748b', fontWeight: 600,
              background: '#f1f5f9', padding: '2px 8px', borderRadius: 5,
            }}>
              #{demande.reference}
            </code>
            {showStatusBadge && <WorkflowBadge status={demande.status} size="sm" />}
            {demande.chef_division_type && (
              <span style={{
                fontSize: '0.7rem', padding: '2px 9px', borderRadius: 5,
                background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
              }}>
                {CHEF_DIVISION_LABELS[demande.chef_division_type]}
              </span>
            )}
            {hasFlag && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.7rem', padding: '2px 9px', borderRadius: 5,
                background: '#fffbeb', color: '#d97706', fontWeight: 700,
                border: '1px solid #fcd34d',
              }}>
                <CIcon icon={cilWarning} style={{ width: 11 }} />
                Réserve active
              </span>
            )}
          </CModalTitle>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e2e8f0', marginBottom: -1 }}>
            <TabBtn
              label="Historique"
              icon={cilHistory}
              active={activeTab === 'historique'}
              onClick={() => setActiveTab('historique')}
              dot={hasFlag}
            />
            <TabBtn
              label="Détails"
              icon={cilDescription}
              active={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            />
          </div>
        </div>
      </CModalHeader>

      {/* ── Body ── */}
      <CModalBody style={{ padding: '28px 32px', minHeight: 320 }}>
        {activeTab === 'details' && (
          <>
            {hasFlag && <FlagBanner onView={() => setActiveTab('historique')} />}
            {children}
          </>
        )}

        {activeTab === 'historique' && (
          <HistoriquePanel
            demandeId={demande.id}
            hasFlag={hasFlag}
            canClearFlag={canClearFlag}
            onFlagCleared={() => {
              onFlagCleared?.()
              setActiveTab('historique')
            }}
          />
        )}
      </CModalBody>

      {/* ── Footer ── */}
      <CModalFooter style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '14px 28px',
        display: 'flex', flexWrap: 'wrap', gap: 8,
        justifyContent: 'flex-end',
      }}>
        {footer}
      </CModalFooter>
    </CModal>
  )
}

export default DemandeModalShell
