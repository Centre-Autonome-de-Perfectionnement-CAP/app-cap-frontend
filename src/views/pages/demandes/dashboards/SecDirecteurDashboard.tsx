// src/views/pages/demandes/dashboards/SecDirecteurDashboard.tsx
// Nouveau rôle : Secrétaire Directeur (slug: sec-dir)
// Reçoit de Directrice Adjointe → transmet au Directeur

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { cilCheckAlt, cilX } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
} from '../components'
import { STATUS_COLORS } from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,     setLoading]     = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={loading}
      onClick={() => setRejectModal(true)} />
    <ActionButton
      label="Transmettre → Directeur"
      icon={cilCheckAlt}
      color="success"
      loading={loading}
      onClick={() => run('sec_directeur_transmit')}  // ← corrigé : était 'sec_directeur_forward'
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Transmission — Secrétaire Directeur" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="info" className="mt-3 py-2 small">
          <strong>Information :</strong> Si vous transmettez, le dossier passe au Directeur pour signature finale.
          Si vous rejetez, il retourne à la secrétaire.
        </CAlert>
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      placeholder="Motif du rejet…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('sec_directeur_reject', { motif }) }}
      // ← correct : ce nom existe bien dans la matrice backend
    />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence',      render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',       render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',           render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Type signature', render: (d: DocumentRequest) => <SignatureTypeCell d={d} /> },
  { header: 'Date',           render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const palette = STATUS_COLORS['sec_directeur_review']

const SecDirecteurDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Documents à transmettre" subtitle="Secrétariat — Directeur"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'sec_directeur_review', label: 'Documents à transmettre', color: palette.color, bg: palette.bg }]}
      counts={{ sec_directeur_review: demandes.length }}
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
