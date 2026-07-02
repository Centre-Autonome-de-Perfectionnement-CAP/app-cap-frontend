// src/views/pages/demandes/dashboards/SecDirecteurDashboard.tsx
// CORRECTION : suppression du header bande bleue (DirectionDashboardShell)
// Utilise désormais DashboardShell, identique aux autres acteurs.

import { useState } from 'react'
import { CAlert, CBadge } from '@coreui/react'
import { cilCheckAlt, cilX, cilWarning } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
  DemandeSearchBar, RetourSecretaireModal,
} from '../components'
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
      Veuillez traiter les corrections nécessaires, puis cliquez sur{' '}
      <strong>"Renvoyer à la Secrétaire"</strong>.
      <br/>
      <span style={{ color: '#dc2626', fontWeight: 700 }}>Un commentaire est obligatoire.</span>
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 14, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.85)', border: '1px solid #fcd34d',
        fontSize: '0.92rem', color: '#78350f',
      }}>
        <strong>Note de la secrétaire :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

// ─── Modal détail ─────────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [retourModal, setRetourModal] = useState(false)
  const inCircuit = !!demande.is_in_correction_circuit

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
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
        <ActionButton label="Transmettre vers Directeur" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => run('sec_directeur_transmit')} />
        <FlaggedValidationAction action="sec_directeur_transmit_flagged" loading={loading}
          run={run} label="Transmettre sous réserve" />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Transmission — Sec. Directeur" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <CorrectionBanner demande={demande} />
        ) : (
          <CAlert color="info" className="mt-3 py-3" style={{ borderRadius: 12, border: 'none', background: '#f0f9ff', color: '#0369a1' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Information de transfert</div>
            <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>
              En transmettant, le dossier passe au Directeur pour signature finale.
            </div>
          </CAlert>
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
      onConfirm={async motif => { setRejectModal(false); await run('sec_directeur_reject', { motif }) }} />
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

const SecDirecteurDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Documents à transmettre"
      subtitle="Secrétaire du Directeur"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'director_secretary_review', label: 'Dossiers à transmettre' }]}
      counts={{ director_secretary_review: demandes.length }}
    >
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun document en attente de transmission" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default SecDirecteurDashboard
