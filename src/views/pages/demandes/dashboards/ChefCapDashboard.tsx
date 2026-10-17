// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx
//
// REFACTORISÉ : Le Chef CAP ne paraphe ni ne signe plus directement.
// Il valide simplement (transmission vers le circuit Direction) ou rejette.
// Dashboard aligné sur le pattern des autres acteurs intermédiaires.

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilWarning, cilSend } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  DemandeSearchBar, RetourSecretaireModal,
  ActorCorrectionNote, CorrectionListNote
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import { STATUS_COLORS } from '../constants/workflow'
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
  const [retourModal, setRetourModal] = useState(false)

  const inCircuit = !!demande.is_in_correction_circuit
  const palette   = STATUS_COLORS['cap_manager_review']

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const footer = (
    <>
      <ActionButton
        label="Fermer"
        color="secondary"
        variant="ghost"
        onClick={onClose}
        disabled={loading}
      />

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
          <ActionButton
            label="Rejeter"
            icon={cilX}
            color="danger"
            variant="outline"
            disabled={loading}
            onClick={() => setRejectModal(true)}
          />
          <ActionButton
            label="Valider → Direction"
            icon={cilCheckAlt}
            customBg={!loading ? palette.color : undefined}
            loading={loading}
            onClick={() => run('chef_cap_validate')}
          />
          <FlaggedValidationAction
            action="chef_cap_validate_flagged"
            loading={loading}
            disabled={loading}
            run={run}
            label="Valider sous réserve"
          />
        </>
      )}
    </>
  )

  return (
    <>
      <DemandeModalShell
        demande={demande}
        visible={visible}
        onClose={onClose}
        title="Validation — Chef CAP"
        footer={footer}
      >
        <DemandeDetailBase demande={demande}>
          {inCircuit ? (
            <ActorCorrectionNote />
          ) : (
            <CAlert
              color="info"
              className="mt-3 py-3"
              style={{ borderRadius: 12, border: 'none', background: '#f0f9ff', color: '#0369a1' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                Transmission vers la Direction
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>
                En validant, le dossier sera transmis au circuit de signature de la Direction
                (Sec. Dir. Adjointe → Directrice Adjointe → Sec. Directeur → Directeur).
              </div>
            </CAlert>
          )}
        </DemandeDetailBase>
      </DemandeModalShell>

      <RetourSecretaireModal
        visible={retourModal}
        demande={demande}
        loading={loading}
        onClose={() => setRetourModal(false)}
        onConfirm={async comment => {
          setRetourModal(false)
          await run('return_to_secretaire', { comment })
        }}
      />

      <MotifModal
        visible={rejectModal}
        title="Rejeter — retour à la secrétaire"
        confirmLabel="Rejeter"
        confirmColor="danger"
        placeholder="Indiquer le motif…"
        onClose={() => setRejectModal(false)}
        onConfirm={async motif => {
          setRejectModal(false)
          await run('chef_cap_reject', { motif })
        }}
      />
    </>
  )
}

// ─── Colonnes tableau ─────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} showDept /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────

const ChefCapDashboard = () => {
  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const columns        = useActionColumns(BASE_COLUMNS, openDetail)
  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length
  const flaggedCount    = demandes.filter(d => !!(d as any).has_flag).length

  return (
    <DashboardShell
      title="Dossiers à valider"
      subtitle="Chef CAP"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'cap_manager_review', label: 'Dossiers à valider' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'Renvoyés par la Secrétaire',
          color: '#2563eb', bg: '#eff6ff', urgent: true,
        }] : []),
        ...(flaggedCount > 0 ? [{
          key: 'flagged', label: 'Réserves actives',
          color: '#d97706', bg: '#fffbeb', urgent: true,
        }] : []),
      ]}
      counts={{
        cap_manager_review: demandes.length,
        correction: correctionCount,
        flagged: flaggedCount,
      }}
    >
      <CorrectionListNote count={correctionCount} />

      <DemandeTable
        demandes={demandes}
        loading={loading}
        columns={columns}
        emptyMessage="Aucun dossier en attente de validation"
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

export default ChefCapDashboard
