// src/views/pages/demandes/dashboards/ComptableDashboard.tsx

import { useState } from 'react'
import { cilCheckAlt, cilX, cilWarning, cilSend } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  RetourSecretaireModal,
  ActorCorrectionNote, CorrectionListNote
} from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,          setLoading]          = useState(false)
  const [rejectModal,      setRejectModal]      = useState(false)
  const [retourModal,      setRetourModal]      = useState(false)
  // Chef division type selection removed as it's now automated
  const [flagMotifModal,   setFlagMotifModal]   = useState(false)

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const inCircuit = !!demande.is_in_correction_circuit

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
        <ActionButton label="Valider et transmettre au Resp. Division" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => run('comptable_validate')} />
        <ActionButton label="Valider sous réserve" icon={cilWarning} color="warning" variant="outline"
          loading={loading} onClick={() => setFlagMotifModal(true)} />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Vérification financière" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? <ActorCorrectionNote /> : null}
      </DemandeDetailBase>
    </DemandeModalShell>

    <RetourSecretaireModal
      visible={retourModal} demande={demande} loading={loading}
      onClose={() => setRetourModal(false)}
      onConfirm={async comment => { setRetourModal(false); await run('return_to_secretaire', { comment }) }}
    />

    {/* ChefDivisionModal removed, automated by backend */}

    <MotifModal visible={flagMotifModal} title="Validation sous réserve"
      confirmLabel="Valider" confirmColor="warning" placeholder="Commentaire de réserve…"
      onClose={() => setFlagMotifModal(false)}
      onConfirm={async motif => {
        setFlagMotifModal(false)
        await run('comptable_validate_flagged', { motif })
      }} />

    <MotifModal visible={rejectModal} title="Rejeter - retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger" placeholder="Décrire le problème financier…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('comptable_reject', { motif }) }} />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ComptableDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length

  return (
    <DashboardShell title="Vérification financière" subtitle="Comptabilité"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'accounting_review', label: 'Dossiers à vérifier' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'Renvoyés par la Secrétaire',
          color: '#2563eb', bg: '#eff6ff', urgent: true,
        }] : []),
      ]}
      counts={{ accounting_review: demandes.length, correction: correctionCount }}>

      <CorrectionListNote count={correctionCount} />

      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente de vérification" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ComptableDashboard
