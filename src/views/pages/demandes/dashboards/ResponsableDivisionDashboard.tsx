// src/views/pages/demandes/dashboards/ResponsableDivisionDashboard.tsx

import { useState } from 'react'
import { CAlert, CBadge } from '@coreui/react'
import { cilCheckAlt, cilX, cilWarning, cilSend } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, ResponsableDivisionTypeCell,
  RetourSecretaireModal,
  ActorCorrectionNote, CorrectionListNote
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import type { DocumentRequest } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,     setLoading]     = useState(false)
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
      <ActionButton
        label="Renvoyer à la Secrétaire"
        icon={cilSend}
        color="primary"
        loading={loading}
        onClick={() => setRetourModal(true)}
      />
    ) : (
      <>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={loading} onClick={() => setRejectModal(true)} />
        <ActionButton label="Valider → Chef CAP" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => run('responsable_division_validate')} />
        <FlaggedValidationAction action="responsable_division_validate_flagged" loading={loading} run={run} />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Validation — Responsable Division" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <ActorCorrectionNote />
        ) : (
          <CAlert color="info" className="mt-3 py-3" style={{ borderRadius: 12, border: 'none', background: '#f0f9ff', color: '#0369a1' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Information de transfert</div>
            <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>
              La validation transmettra le dossier au Chef CAP. En cas de rejet, le dossier est renvoyé à la secrétaire.
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
      confirmLabel="Rejeter" confirmColor="danger" placeholder="Motif du rejet…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('responsable_division_reject', { motif }) }} />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence',  render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',   render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',       render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Formation',  render: (d: DocumentRequest) => <ResponsableDivisionTypeCell d={d} /> },
  { header: 'Date',       render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ResponsableDivisionDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length

  return (
    <DashboardShell title="Dossiers à valider" subtitle="Responsable Division"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'division_manager_review', label: 'En attente de validation' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'Renvoyés par la Secrétaire',
          color: '#2563eb', bg: '#eff6ff', urgent: true,
        }] : []),
      ]}
      counts={{ division_manager_review: demandes.length, correction: correctionCount }}>

      <CorrectionListNote count={correctionCount} />

      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente de validation" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ResponsableDivisionDashboard
