// src/views/pages/demandes/dashboards/DirectriceAdjointeDashboard.tsx
// Rôle : Directrice Adjointe (slug: directrice-adjointe)
// Reçoit de Sec. Dir. Adjointe → signe → Sec. Directeur

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { cilX, cilCheck } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
} from '../components'
import { STATUS_COLORS } from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,     setLoading]     = useState(false)
  const [confirmed,   setConfirmed]   = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const palette = STATUS_COLORS['directrice_adjointe_review']

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false); setConfirmed(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={loading}
      onClick={() => setRejectModal(true)} />
    <ActionButton
      label="Signer → Sec. Directeur"
      icon={cilCheck}
      customBg={confirmed && !loading ? palette.color : undefined}
      loading={loading}
      disabled={!confirmed}
      onClick={() => run('directrice_adjointe_sign')}
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Signature — Directrice Adjointe" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="warning" className="mt-3 py-2 small">
          <strong>Attention :</strong> En signant, le dossier passe à la Sec. Directeur pour transmission finale.
          Cette action est définitive.
        </CAlert>
        <ConfirmCheckbox
          id="confirm-directrice-adjointe"
          checked={confirmed}
          onChange={setConfirmed}
          label={<>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>Directrice Adjointe</strong>.</>}
        />
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('directrice_adjointe_reject', { motif }) }}
    />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence',      render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',       render: (d: DocumentRequest) => <EtudiantCell d={d} showDept={false} /> },
  { header: 'Type',           render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Type signature', render: (d: DocumentRequest) => <SignatureTypeCell d={d} /> },
  { header: 'Date',           render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const palette = STATUS_COLORS['directrice_adjointe_review']

const DirectriceAdjointeDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Documents à signer" subtitle="Direction Adjointe"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'directrice_adjointe_review', label: 'Documents à signer', color: palette.color, bg: palette.bg }]}
      counts={{ directrice_adjointe_review: demandes.length }}
    >
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun document en attente de signature" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default DirectriceAdjointeDashboard
