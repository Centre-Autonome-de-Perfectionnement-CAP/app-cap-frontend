// src/views/pages/demandes/dashboards/DirecteurDashboard.tsx
import { useState } from 'react'
import { CButton, CAlert, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilCheck, cilTask } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, SignatureTypeCell,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { ColumnDef } from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

type DirecteurRole = 'directeur-adjoint' | 'directeur'

const ROLE_CONFIG: Record<DirecteurRole, {
  label: string
  subtitle: string
  signAction: string
  rejectAction: string
  color: string
  bg: string
}> = {
  'directeur-adjoint': {
    label: 'Directeur Adjoint',
    subtitle: 'Direction Adjointe',
    signAction: 'directeur_adjoint_sign',
    rejectAction: 'directeur_adjoint_reject',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  'directeur': {
    label: 'Directeur',
    subtitle: 'Direction',
    signAction: 'directeur_sign',
    rejectAction: 'directeur_reject',
    color: '#dc2626',
    bg: '#fef2f2',
  },
}

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction, role }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  role: DirecteurRole
}) => {
  const [loading,     setLoading]     = useState(false)
  const [confirmed,   setConfirmed]   = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const config = ROLE_CONFIG[role]

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false); setConfirmed(false) }
  }

  const canSign = confirmed && !loading

  const footer = (<>
    <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading}>Fermer</CButton>
    <CButton color="danger" variant="outline" onClick={() => setRejectModal(true)} disabled={loading}>
      <CIcon icon={cilX} className="me-1" />Rejeter
    </CButton>
    <CButton
      style={{
        background: canSign ? config.color : '#d1d5db',
        borderColor: canSign ? config.color : '#d1d5db',
        color: 'white', transition: 'all 0.2s',
      }}
      onClick={() => run(config.signAction)}
      disabled={!canSign}
    >
      {loading
        ? <CSpinner size="sm" />
        : <><CIcon icon={cilCheck} className="me-1" />Signer — Document prêt</>}
    </CButton>
  </>)

  return (<>
    <DemandeModalShell
      demande={demande}
      visible={visible}
      onClose={onClose}
      title={`Signature — ${config.label}`}
      footer={footer}
    >
      <DemandeDetailBase demande={demande}>
        <CAlert color="warning" className="mt-3 py-2 small">
          <strong>Attention :</strong> En signant, le document sera marqué prêt à retirer par l'étudiant. Cette action est définitive.
        </CAlert>
        <ConfirmCheckbox
          id={`confirm-${role}`}
          checked={confirmed}
          onChange={setConfirmed}
          label={
            <>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>{config.label}</strong>.</>
          }
        />
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter"
      confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run(config.rejectAction, { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const DirecteurDashboard = ({ role }: { role: DirecteurRole }) => {
  const config = ROLE_CONFIG[role]
  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const columns: ColumnDef[] = [
    { header: 'Référence',      render: d => <ReferenceCell d={d} /> },
    { header: 'Étudiant',       render: d => <EtudiantCell d={d} showDept={false} /> },
    { header: 'Type',           render: d => <TypeCell d={d} /> },
    { header: 'Type signature', render: d => <SignatureTypeCell d={d} /> },
    { header: 'Date',           render: d => <DateCell d={d} /> },
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
      title="Documents à signer"
      subtitle={config.subtitle}
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'total', label: 'Documents à signer', color: config.color, bg: config.bg }]}
      counts={{ total: demandes.length }}
    >
      <DemandeTable
        demandes={demandes}
        loading={loading}
        columns={columns}
        emptyMessage="Aucun document en attente de signature"
        onRowClick={openDetail}
      />
      {selected && (
        <DetailModal
          demande={selected}
          visible={detailOpen}
          onClose={closeDetail}
          onAction={handleAction}
          role={role}
        />
      )}
    </DashboardShell>
  )
}

export default DirecteurDashboard
