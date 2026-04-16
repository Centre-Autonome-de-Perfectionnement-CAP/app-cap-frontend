// src/views/pages/demandes/dashboards/ComptableDashboard.tsx

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { cilCheckAlt, cilX, cilWarning } from '@coreui/icons'   // ← cilWarning ajouté
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  FinancialPanel, ActionButton, useActionColumns, ChefDivisionModal,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [chefDivModal, setChefDivModal] = useState(false)
  // ── AJOUT : États pour le flux "sous réserve" en 2 étapes ────────────────
  const [chefDivFlagModal, setChefDivFlagModal] = useState(false)
  const [pendingFlagType, setPendingFlagType] = useState<ChefDivisionType | null>(null)
  const [flagMotifModal, setFlagMotifModal] = useState(false)
  // ─────────────────────────────────────────────────────────────────────────

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={loading}
      onClick={() => setRejectModal(true)} />
    <ActionButton
      label="Valider → Resp. Division"
      icon={cilCheckAlt}
      color="success"
      loading={loading}
      onClick={() => setChefDivModal(true)}
    />
    {/* ── AJOUT : bouton valider sous réserve ── */}
    <ActionButton
      label="Valider sous réserve"
      icon={cilWarning}
      color="warning"
      variant="outline"
      loading={loading}
      onClick={() => setChefDivFlagModal(true)}
    />
  </>)

  return (<>
    <DemandeModalShell
      demande={demande}
      visible={visible}
      onClose={onClose}
      title="Vérification financière"
      footer={footer}
    >
      <DemandeDetailBase demande={demande}>
        <FinancialPanel demande={demande} />
        <CAlert color="info" className="mt-3 py-2 small">
          <strong>Information :</strong> Vérifiez la situation financière avant de valider.
          Vous devrez ensuite sélectionner le Responsable Division concerné.
          En cas de problème, rejetez avec un commentaire explicite.
        </CAlert>
      </DemandeDetailBase>
    </DemandeModalShell>

    {/* Sélecteur division — validation normale */}
    <ChefDivisionModal
      visible={chefDivModal}
      onClose={() => setChefDivModal(false)}
      onConfirm={(type: ChefDivisionType) => {
        setChefDivModal(false)
        run('comptable_validate', { chef_division_type: type })
      }}
    />

    {/* ── AJOUT : Sélecteur division — validation sous réserve (étape 1/2) ── */}
    <ChefDivisionModal
      visible={chefDivFlagModal}
      onClose={() => setChefDivFlagModal(false)}
      onConfirm={(type: ChefDivisionType) => {
        setChefDivFlagModal(false)
        setPendingFlagType(type)
        setFlagMotifModal(true)
      }}
    />

    {/* ── AJOUT : Motif réserve — validation sous réserve (étape 2/2) ── */}
    <MotifModal
      visible={flagMotifModal}
      title="Validation sous réserve"
      confirmLabel="Valider"
      confirmColor="warning"
      placeholder="Entrez le commentaire de réserve..."
      onClose={() => { setFlagMotifModal(false); setPendingFlagType(null) }}
      onConfirm={async (motif) => {
        setFlagMotifModal(false)
        await run('comptable_validate_flagged', { chef_division_type: pendingFlagType, motif })
        setPendingFlagType(null)
      }}
    />

    {/* Rejet */}
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

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant', render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type', render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date', render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ComptableDashboard = () => {
  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Vérification financière"
      subtitle="Comptabilité"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'comptable_review', label: 'Dossiers à vérifier' }]}
      counts={{ comptable_review: demandes.length }}
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
