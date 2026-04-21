// src/views/pages/demandes/dashboards/ChefDivisionDashboard.tsx

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { cilCheckAlt, cilX, cilReload } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, ChefDivisionTypeCell,
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import type { DocumentRequest } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,     setLoading]     = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const inCircuit = !!demande.is_in_correction_circuit

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />

    {inCircuit ? (
      <ActionButton label="Renvoyer à la Secrétaire" icon={cilReload} color="warning"
        loading={loading} onClick={() => run('return_to_secretaire')} />
    ) : (
      <>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={loading} onClick={() => setRejectModal(true)} />
        <ActionButton label="Valider → Chef CAP" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => run('chef_division_validate')} />
        <FlaggedValidationAction action="chef_division_validate_flagged" loading={loading} run={run} />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Validation — Responsable Division" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <CAlert color="warning" className="mt-3 py-2 small">
            <strong>Circuit de correction actif.</strong> Corrigez le dossier puis
            cliquez sur <strong>"Renvoyer à la Secrétaire"</strong>.
          </CAlert>
        ) : (
          <CAlert color="info" className="mt-3 py-2 small">
            <strong>Information :</strong> Si vous validez, le dossier passe au Chef CAP.
            Si vous rejetez, il retourne à la secrétaire.
          </CAlert>
        )}
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger" placeholder="Motif du rejet…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('chef_division_reject', { motif }) }} />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence',  render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',   render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',       render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Formation',  render: (d: DocumentRequest) => <ChefDivisionTypeCell d={d} /> },
  { header: 'Date',       render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ChefDivisionDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell title="Dossiers à valider" subtitle="Responsable Division"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'chef_division_review', label: 'En attente de validation' }]}
      counts={{ chef_division_review: demandes.length }}>
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente de validation" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ChefDivisionDashboard
