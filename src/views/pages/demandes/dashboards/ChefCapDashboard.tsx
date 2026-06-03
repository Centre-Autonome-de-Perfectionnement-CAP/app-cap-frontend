// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx
//
// REFACTORISÉ : Le Chef CAP ne paraphe ni ne signe plus directement.
// Il valide simplement (transmission vers le circuit Direction) ou rejette.
// Dashboard aligné sur le pattern des autres acteurs intermédiaires.

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilWarning } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  DemandeSearchBar, RetourSecretaireModal,
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import { STATUS_COLORS } from '../constants/workflow'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Bannière circuit de correction ───────────────────────────────────────────

const CorrectionBanner = ({ demande }: { demande: DocumentRequest }) => (
  <div style={{
    background: '#fffbeb', border: '1.5px solid #fcd34d',
    borderLeft: '4px solid #f59e0b',
    borderRadius: 10, padding: '14px 18px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{
        display: 'inline-flex', width: 24, height: 24, borderRadius: '50%',
        background: '#f97316', color: '#fff', fontSize: '0.875rem',
        fontWeight: 900, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>⟳</span>
      <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#78350f' }}>
        Dossier en correction — navette active
      </span>
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 8, padding: '8px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.8)', border: '1px solid #fcd34d',
        fontSize: '0.875rem', color: '#78350f',
      }}>
        <strong>Problème signalé :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

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
          icon={cilWarning}
          color="warning"
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
            <CorrectionBanner demande={demande} />
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
          key: 'correction', label: 'En correction ↺',
          color: '#ea580c', bg: '#fff7ed', urgent: true,
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
      {correctionCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff7ed', border: '1.5px solid #fed7aa',
          borderRadius: '12px 12px 0 0',
          padding: '10px 18px', borderBottom: '1px solid #fde68a',
        }}>
          <CIcon icon={cilWarning} style={{ width: 16, color: '#f97316' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#78350f' }}>
            {correctionCount} dossier{correctionCount > 1 ? 's' : ''} en attente de correction navette
          </span>
        </div>
      )}

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
