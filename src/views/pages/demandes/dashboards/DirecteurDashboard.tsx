// src/views/pages/demandes/dashboards/DirecteurDashboard.tsx

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
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

type DirecteurRole = 'directeur-adjoint' | 'directeur'

const ROLE_CONFIG: Record<DirecteurRole, {
  label: string; subtitle: string; statusKey: string
  signAction: string; rejectAction: string
}> = {
  'directeur-adjoint': {
    label: 'Directeur Adjoint',
    subtitle: 'Direction Adjointe',
    statusKey: 'directeur_adjoint_review',
    signAction: 'directeur_adjoint_sign',
    rejectAction: 'directeur_adjoint_reject',
  },
  'directeur': {
    label: 'Directeur',
    subtitle: 'Direction',
    statusKey: 'directeur_review',
    signAction: 'directeur_sign',
    rejectAction: 'directeur_reject',
  },
}

const DetailModal = ({ demande, visible, onClose, onAction, role }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  role: DirecteurRole
}) => {
  const [loading,     setLoading]     = useState(false)
  const [confirmed,   setConfirmed]   = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const config  = ROLE_CONFIG[role]
  const palette = STATUS_COLORS[config.statusKey]

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
      label="Signer — Document prêt"
      icon={cilCheck}
      customBg={confirmed && !loading ? palette.color : undefined}
      loading={loading}
      disabled={!confirmed}
      onClick={() => run(config.signAction)}
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title={`Signature — ${config.label}`} footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="warning" className="mt-3 py-2 small">
          <strong>Attention :</strong> En signant, le document sera marqué prêt à retirer par l'étudiant.
          Cette action est définitive.
        </CAlert>
        <ConfirmCheckbox
          id={`confirm-${role}`}
          checked={confirmed}
          onChange={setConfirmed}
          label={<>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>{config.label}</strong>.</>}
        />
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run(config.rejectAction, { motif }) }}
    />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence',       render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',        render: (d: DocumentRequest) => <EtudiantCell d={d} showDept={false} /> },
  { header: 'Type',            render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Type signature',  render: (d: DocumentRequest) => <SignatureTypeCell d={d} /> },
  { header: 'Date',            render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const DirecteurDashboard = ({ role }: { role: DirecteurRole }) => {
  const config  = ROLE_CONFIG[role]
  const palette = STATUS_COLORS[config.statusKey]

  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Documents à signer" subtitle={config.subtitle}
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: config.statusKey, label: 'Documents à signer', color: palette.color, bg: palette.bg }]}
      counts={{ [config.statusKey]: demandes.length }}
    >
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun document en attente de signature" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail}
          onAction={handleAction} role={role} />
      )}
    </DashboardShell>
  )
}

export default DirecteurDashboard
