// src/views/pages/demandes/dashboards/DirectriceAdjointeDashboard.tsx
// VERSION REFACTORISÉE — avec stats, profil acteur visible, sans accès portail

import { useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CBadge } from '@coreui/react'
import { cilX, cilCheck, cilWarning } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import { useDirectionStats } from '../hooks/useDirectionStats'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
  DemandeSearchBar, RetourSecretaireModal,
} from '../components'
import { STATUS_COLORS } from '../constants/workflow'
import DirectionDashboardShell, { DIRECTRICE_ADJOINTE_STAT_DEFS } from '../components/layout/DirectionDashboardShell'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Bannière circuit de correction ───────────────────────────────────────────

const CorrectionBanner = ({ demande }: { demande: DocumentRequest }) => (
  <div style={{
    background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
    border: '2px solid #fcd34d',
    borderLeft: '5px solid #f59e0b',
    borderRadius: 12, padding: '18px 20px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{
        display: 'inline-flex', width: 28, height: 28, borderRadius: '50%',
        background: '#f97316', color: '#fff', fontSize: '0.9rem',
        fontWeight: 900, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>⟳</span>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#78350f' }}>
        Dossier en circuit de correction
      </span>
      <CBadge color="warning" style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '6px 12px', color: '#fff' }}>
        Navette active
      </CBadge>
    </div>
    <div style={{ fontSize: '0.95rem', color: '#92400e', lineHeight: 1.7 }}>
      Veuillez examiner les corrections apportées, puis cliquez sur{' '}
      <strong>"Renvoyer à la Secrétaire"</strong> pour confirmer.
      <br/>
      <span style={{ color: '#dc2626', fontWeight: 700 }}>Un commentaire est obligatoire.</span>
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 14, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.85)', border: '1px solid #fcd34d',
        fontSize: '0.92rem', color: '#78350f',
      }}>
        <strong>Note :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

// ─── Modal détail ─────────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,   setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [retourModal, setRetourModal] = useState(false)
  const palette   = STATUS_COLORS['directrice_adjointe_review']
  const inCircuit = !!demande.is_in_correction_circuit

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false); setConfirmed(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    {inCircuit ? (
      <ActionButton label="Renvoyer à la Secrétaire" icon={cilWarning} color="warning"
        loading={loading} onClick={() => setRetourModal(true)} />
    ) : (
      <>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={loading} onClick={() => setRejectModal(true)} />
        <ActionButton
          label="Signer — Transmettre au Sec. Directeur" icon={cilCheck}
          customBg={confirmed && !loading ? palette.color : undefined}
          loading={loading} disabled={!confirmed}
          onClick={() => run('directrice_adjointe_sign')}
        />
        <FlaggedValidationAction action="directrice_adjointe_sign_flagged"
          loading={loading} disabled={!confirmed} run={run} label="Signer sous réserve" />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Signature — Directrice Adjointe" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <CorrectionBanner demande={demande} />
        ) : (
          <>
            <CAlert color="warning" className="mt-3 py-3" style={{ borderRadius: 12, border: 'none', background: '#fffbeb', color: '#92400e' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Attention :</div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>
                En signant, le dossier sera transmis au Secrétaire du Directeur. Action définitive.
              </div>
            </CAlert>
            <div style={{ padding: '0 4px' }}>
              <ConfirmCheckbox id="confirm-directrice-adjointe" checked={confirmed} onChange={setConfirmed}
                label={<>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>Directrice Adjointe</strong>.</>} />
            </div>
          </>
        )}
      </DemandeDetailBase>
    </DemandeModalShell>

    <RetourSecretaireModal
      visible={retourModal} demande={demande} loading={loading}
      onClose={() => setRetourModal(false)}
      onConfirm={async comment => { setRetourModal(false); await run('return_to_secretaire', { comment }) }}
    />

    <MotifModal visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('directrice_adjointe_reject', { motif }) }} />
  </>)
}

// ─── Colonnes tableau ─────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence',      render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',       render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',           render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Type signature', render: (d: DocumentRequest) => <SignatureTypeCell d={d} /> },
  { header: 'Date',           render: (d: DocumentRequest) => <DateCell d={d} /> },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────

const DirectriceAdjointeDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const { stats, statsLoading } = useDirectionStats(demandes)
  const columns = useActionColumns(BASE_COLUMNS, openDetail)
  const correctionCount = stats.inCircuit

  return (
    <DirectionDashboardShell
      roleLabel="Directrice Adjointe"
      accentColor="#6d28d9"
      actionLabel="Documents à signer"
      stats={stats}
      statsLoading={statsLoading}
      statDefs={DIRECTRICE_ADJOINTE_STAT_DEFS}
    >
      {correctionCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
          border: '1.5px solid #fed7aa', borderRadius: '12px 12px 0 0',
          padding: '14px 24px', borderBottom: '1px solid #fde68a',
          marginBottom: -1, position: 'relative', zIndex: 1,
        }}>
          <CIcon icon={cilWarning} style={{ width: 20, color: '#f97316' }} />
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#78350f' }}>
            {correctionCount} dossier{correctionCount > 1 ? 's' : ''} en circuit de correction — Priorité
          </span>
        </div>
      )}

      <CCard className="border-0" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: correctionCount > 0 ? '0 0 14px 14px' : 14 }}>
        <CCardHeader className="bg-white" style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 24px 16px' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.45rem', color: '#0f172a', letterSpacing: '-0.025em' }}>Documents à signer</div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: 2, fontWeight: 500 }}>
                {demandes.length} dossier{demandes.length !== 1 ? 's' : ''} en attente
              </div>
            </div>
            <DemandeSearchBar search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })} />
          </div>
        </CCardHeader>
        <CCardBody style={{ padding: 0 }}>
          <DemandeTable demandes={demandes} loading={loading} columns={columns}
            emptyMessage="Aucun document en attente de signature" onRowClick={openDetail} />
        </CCardBody>
      </CCard>

      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DirectionDashboardShell>
  )
}

export default DirectriceAdjointeDashboard
