// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx
// - Onglet Action allégé et plus lisible
// - Loading isolé par bouton (loadingAction: string | null)
// - Moins de surcharge visuelle

import { useState } from 'react'
import { CBadge } from '@coreui/react'
import { cilX, cilPen, cilCheck, cilWarning, cilArrowLeft, cilDescription, cilHistory, cilTask } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeDetailBase,
  ConfirmCheckbox, RadioCard, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  RetourSecretaireModal,
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import { WorkflowBadge } from '@/components/document-request'
import { CHEF_DIVISION_LABELS } from '@/types/document-request.types'
import HistoriquePanel from '../components/modal/HistoriquePanel'
import type { DocumentRequest } from '@/types/document-request.types'

const ICON_MAP: Record<string, object> = { cilPen, cilCheck, cilX }

type CapChoice  = 'paraphe' | 'signature'
type ModalTab   = 'details' | 'action' | 'historique'

const CAP_CHOICES: {
  value: CapChoice; label: string; desc: string; color: string; nextLabel: string; icon: string
}[] = [
  {
    value: 'paraphe', label: 'Parapher', color: '#7c3aed', icon: 'cilPen',
    nextLabel: 'Parapher et transmettre',
    desc: 'Le dossier passera chez la Sec. Dir. Adjointe → Dir. Adjointe → Sec. Directeur → Directeur.',
  },
  {
    value: 'signature', label: 'Signer directement', color: '#059669', icon: 'cilCheck',
    nextLabel: 'Signer — Document prêt',
    desc: 'Le document est validé directement et sera immédiatement disponible au retrait.',
  },
]

// ─── Onglet bouton ────────────────────────────────────────────────────────────

const ModalTabBtn = ({
  label, active, onClick, icon,
}: {
  label: string; active: boolean; onClick: () => void; icon: any
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '9px 16px', borderRadius: '7px 7px 0 0',
      border: 'none',
      borderBottom: active ? '2px solid #0284c7' : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.875rem',
      color: active ? '#0284c7' : '#6b7280',
      background: active ? '#f0f9ff' : 'transparent',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    <CIcon icon={icon} style={{ width: 14, flexShrink: 0 }} />
    {label}
  </button>
)

// ─── Bannière correction ──────────────────────────────────────────────────────

const CorrectionBanner = ({ demande }: { demande: DocumentRequest }) => (
  <div style={{
    background: '#fffbeb', border: '1.5px solid #fcd34d',
    borderLeft: '4px solid #f59e0b',
    borderRadius: 10, padding: '14px 18px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{
        display: 'inline-flex', width: 24, height: 24, borderRadius: '50%',
        background: '#f97316', color: '#fff', fontSize: '0.875rem',
        fontWeight: 900, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>⟳</span>
      <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#78350f' }}>
        Dossier en correction — navette active
      </span>
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 8, padding: '8px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.8)', border: '1px solid #fcd34d',
        fontSize: '0.875rem', color: '#78350f',
      }}>
        <strong>Problème signalé :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

// ─── Modal principal Chef CAP ──────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [activeTab,     setActiveTab]     = useState<ModalTab>('details')
  const [choice,        setChoice]        = useState<CapChoice>('paraphe')
  const [confirmed,     setConfirmed]     = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [rejectModal,   setRejectModal]   = useState(false)
  const [retourModal,   setRetourModal]   = useState(false)

  const selectedChoice = CAP_CHOICES.find(c => c.value === choice)!
  const inCircuit      = !!demande.is_in_correction_circuit
  const hasFlag        = !!(demande as any).has_flag

  const handleClose = () => {
    setActiveTab('details')
    setConfirmed(false)
    onClose()
  }

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoadingAction(action)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoadingAction(null); setConfirmed(false) }
  }

  return (<>
    <CModal visible={visible} onClose={handleClose} size="xl" alignment="center" scrollable>
      {/* ── Header ── */}
      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '18px 28px 0', background: '#fff' }}>
        <div style={{ width: '100%' }}>
          <CModalTitle style={{
            display: 'flex', alignItems: 'center', gap: 10,
            flexWrap: 'wrap', marginBottom: 14,
          }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              Chef CAP
            </span>
            <code style={{
              fontSize: '0.82rem', color: '#64748b', fontWeight: 600,
              background: '#f1f5f9', padding: '2px 8px', borderRadius: 5,
            }}>
              #{demande.reference}
            </code>
            <WorkflowBadge status={demande.status} size="sm" />
            {demande.chef_division_type && (
              <span style={{
                fontSize: '0.78rem', padding: '3px 8px', borderRadius: 5,
                background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
              }}>
                {CHEF_DIVISION_LABELS[demande.chef_division_type]}
              </span>
            )}
            {hasFlag && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.78rem', padding: '3px 8px', borderRadius: 5,
                background: '#fffbeb', color: '#d97706', fontWeight: 700,
                border: '1px solid #fcd34d',
              }}>
                <CIcon icon={cilWarning} style={{ width: 12 }} />
                Réserve active
              </span>
            )}
            {inCircuit && (
              <CBadge color="warning" style={{ fontSize: '0.78rem', padding: '3px 8px', color: '#fff' }}>
                Navette
              </CBadge>
            )}
          </CModalTitle>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e2e8f0', marginBottom: -1 }}>
            <ModalTabBtn
              label="Détails"
              icon={cilDescription}
              active={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            />
            {!inCircuit && (
              <ModalTabBtn
                label="Action"
                icon={cilTask}
                active={activeTab === 'action'}
                onClick={() => setActiveTab('action')}
              />
            )}
            <ModalTabBtn
              label="Historique"
              icon={cilHistory}
              active={activeTab === 'historique'}
              onClick={() => setActiveTab('historique')}
            />
          </div>
        </div>
      </CModalHeader>

      {/* ── Body ── */}
      <CModalBody style={{ padding: '24px 28px', minHeight: 280 }}>

        {/* Onglet Détails */}
        {activeTab === 'details' && (
          <>
            {inCircuit && <CorrectionBanner demande={demande} />}
            <DemandeDetailBase demande={demande} />
          </>
        )}

        {/* Onglet Action */}
        {activeTab === 'action' && !inCircuit && (
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 14 }}>
              Quelle action souhaitez-vous effectuer ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {CAP_CHOICES.map(opt => (
                <RadioCard
                  key={opt.value}
                  value={opt.value}
                  selected={choice}
                  onSelect={v => { setChoice(v as CapChoice); setConfirmed(false) }}
                  label={opt.label}
                  description={opt.desc}
                  color={opt.color}
                  icon={ICON_MAP[opt.icon]}
                />
              ))}
            </div>

            <ConfirmCheckbox
              id="confirm-cap"
              checked={confirmed}
              onChange={setConfirmed}
              label="J'ai vérifié le dossier et je confirme ma décision."
            />
          </div>
        )}

        {/* Onglet Historique */}
        {activeTab === 'historique' && (
          <HistoriquePanel demandeId={demande.id} />
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
        <ActionButton
          label="Fermer"
          color="secondary"
          variant="ghost"
          onClick={handleClose}
          disabled={!!loadingAction}
        />

        {inCircuit ? (
          <ActionButton
            label="Renvoyer à la Secrétaire"
            icon={cilArrowLeft}
            color="warning"
            loading={loadingAction === 'return_to_secretaire'}
            disabled={!!loadingAction && loadingAction !== 'return_to_secretaire'}
            onClick={() => setRetourModal(true)}
          />
        ) : (
          <>
            <ActionButton
              label="Rejeter"
              icon={cilX}
              color="danger"
              variant="outline"
              disabled={!!loadingAction}
              onClick={() => setRejectModal(true)}
            />
            <ActionButton
              label={selectedChoice.nextLabel}
              icon={selectedChoice.icon}
              customBg={confirmed && !loadingAction ? selectedChoice.color : undefined}
              loading={loadingAction === 'chef_cap_sign'}
              disabled={!confirmed || (!!loadingAction && loadingAction !== 'chef_cap_sign')}
              onClick={() => run('chef_cap_sign', { signature_type: choice })}
            />
            <FlaggedValidationAction
              action="chef_cap_sign_flagged"
              loading={loadingAction === 'chef_cap_sign_flagged'}
              disabled={!confirmed || (!!loadingAction && loadingAction !== 'chef_cap_sign_flagged')}
              run={async (action, payload) => run(action, { ...payload, signature_type: choice })}
              label="Signer sous réserve"
            />
          </>
        )}
      </CModalFooter>
    </CModal>

    <RetourSecretaireModal
      visible={retourModal}
      demande={demande}
      loading={loadingAction === 'return_to_secretaire'}
      onClose={() => setRetourModal(false)}
      onConfirm={async comment => { setRetourModal(false); await run('return_to_secretaire', { comment }) }}
    />

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter"
      confirmColor="danger"
      placeholder="Indiquer le motif…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('chef_cap_reject', { motif }) }}
    />
  </>)
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} showDept /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ChefCapDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length
  const flaggedCount    = demandes.filter(d => !!(d as any).has_flag).length

  return (
    <DashboardShell
      title="Documents à traiter"
      subtitle="Chef CAP"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'cap_manager_review', label: 'Documents à traiter' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'En correction ↺',
          color: '#ea580c', bg: '#fff7ed', urgent: true,
        }] : []),
        ...(flaggedCount > 0 ? [{
          key: 'flagged', label: 'Réserves actives',
          color: '#d97706', bg: '#fffbeb', urgent: true,
        }] : []),
      ]}
      counts={{
        cap_manager_review: demandes.length,
        correction: correctionCount,
        flagged: flaggedCount,
      }}
    >
      {correctionCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff7ed', border: '1.5px solid #fed7aa',
          borderRadius: '12px 12px 0 0',
          padding: '10px 18px', borderBottom: '1px solid #fde68a',
        }}>
          <CIcon icon={cilWarning} style={{ width: 16, color: '#f97316' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#78350f' }}>
            {correctionCount} dossier{correctionCount > 1 ? 's' : ''} en attente de correction navette
          </span>
        </div>
      )}

      <DemandeTable
        demandes={demandes}
        loading={loading}
        columns={columns}
        emptyMessage="Aucun document en attente de traitement"
        onRowClick={openDetail}
      />

      {selected && (
        <DetailModal
          demande={selected}
          visible={detailOpen}
          onClose={closeDetail}
          onAction={handleAction}
        />
      )}
    </DashboardShell>
  )
}

export default ChefCapDashboard
