// src/views/pages/demandes/dashboards/ComptableDashboard.tsx
import { useState } from 'react'
import { CButton, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilTask } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  FinancialPanel, ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { ColumnDef } from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,     setLoading]     = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (<>
    <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading}>Fermer</CButton>
    <CButton color="danger" variant="outline" onClick={() => setRejectModal(true)} disabled={loading}>
      <CIcon icon={cilX} className="me-1" />Rejeter
    </CButton>
    <CButton color="success" onClick={() => run('comptable_validate')} disabled={loading}>
      <CIcon icon={cilCheckAlt} className="me-1" />Valider → Chef CAP
    </CButton>
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose} title="Vérification financière" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <FinancialPanel demande={demande} />
        <CAlert color="info" className="mt-3 py-2 small">
          <strong>Information :</strong> Vérifiez la situation financière avant de valider. En cas de problème, rejetez avec un commentaire explicite.
        </CAlert>
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter"
      confirmColor="danger"
      placeholder="Décrire le problème financier…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('comptable_reject', { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const ComptableDashboard = () => {
  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const columns: ColumnDef[] = [
    { header: 'Référence', render: d => <ReferenceCell d={d} /> },
    { header: 'Étudiant',  render: d => <EtudiantCell d={d} /> },
    { header: 'Type',      render: d => <TypeCell d={d} /> },
    { header: 'Date',      render: d => <DateCell d={d} /> },
    {
      header: '', width: 50,
      render: d => (
        <td>
          <CButton color="primary" size="sm" variant="ghost"
            onClick={e => { e.stopPropagation(); openDetail(d) }}>
            <CIcon icon={cilTask} />
          </CButton>
        </td>
      ),
    },
  ]

  return (
    <DashboardShell
      title="Vérification financière"
      subtitle="Comptabilité"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'total', label: 'Dossiers à vérifier', color: '#06b6d4', bg: '#ecfeff' }]}
      counts={{ total: demandes.length }}
    >
      <DemandeTable
        demandes={demandes}
        loading={loading}
        columns={columns}
        emptyMessage="Aucun dossier en attente de vérification"
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

export default ComptableDashboard
