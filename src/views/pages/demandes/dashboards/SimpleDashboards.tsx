// ═══════════════════════════════════════════════════════════════════════════════
// FICHIER GROUPÉ : tous les dashboards simples (non-secrétaire) — VERSION 2
// Chaque section est un fichier à part à créer (voir guide d'intégration)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// ComptableDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  FinancialPanel, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

const ComptableDetailModal = ({ demande, logs, visible, onClose, onAction }: any) => {
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const run = async (action: string, extra?: any) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) {} finally { setLoading(false) }
  }
  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={loading}
      onClick={() => setShowReject(true)} />
    <ActionButton label="Valider → Chef Division" icon={cilCheckAlt} color="success" loading={loading}
      onClick={() => run('comptable_validate')} />
  </>)
  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Vérification financière — Comptabilité" footer={footer}>
      <DemandeDetailBase demande={demande} logs={logs}>
        <FinancialPanel demande={demande} />
        <CAlert color="info" className="mt-3 py-2" style={{ fontSize: '0.82rem' }}>
          Vérifiez la situation financière avant de valider.
          En cas de problème, rejetez avec un commentaire explicite.
        </CAlert>
      </DemandeDetailBase>
    </DemandeModalShell>
    <MotifModal visible={showReject} title="Rejeter — retour secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      placeholder="Décrire le problème financier…"
      onClose={() => setShowReject(false)}
      onConfirm={async motif => { setShowReject(false); await run('comptable_reject', { motif }) }} />
  </>)
}

export const ComptableDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, logs, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns([
    { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
    { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
    { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
    { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
  ], openDetail)
  return (
    <DashboardShell title="Vérification financière" subtitle="Comptabilité"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'comptable_review', label: 'Dossiers à vérifier' }]}
      counts={{ comptable_review: demandes.length }}>
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente de vérification" onRowClick={openDetail} />
      {selected && <ComptableDetailModal demande={selected} logs={logs} visible={detailOpen}
        onClose={closeDetail} onAction={handleAction} />}
    </DashboardShell>
  )
}

export default ComptableDashboard

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE générique pour : ChefDivision, SecretaireDA, SecretaireDirecteur
// ─────────────────────────────────────────────────────────────────────────────
// Ces 3 rôles ont le même pattern : valider → maillon suivant, rejeter → secrétaire

interface SimpleTransmitDashboardProps {
  title: string
  subtitle: string
  statusKey: string
  validateAction: string
  rejectAction: string
  validateLabel: string
  validateColor?: string
}

export const SimpleTransmitDashboard = ({
  title, subtitle, statusKey,
  validateAction, rejectAction, validateLabel,
  validateColor = 'success',
}: SimpleTransmitDashboardProps) => {
  const [showReject, setShowReject] = useState(false)
  const { demandes, loading, filters, setFilters, selected, logs, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const run = async (action: string, extra?: any) => {
    await handleAction(action, extra)
  }

  const columns = useActionColumns([
    { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
    { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
    { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
    { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
  ], openDetail)

  return (
    <DashboardShell
      title={title} subtitle={subtitle}
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: statusKey, label: 'Dossiers en attente' }]}
      counts={{ [statusKey]: demandes.length }}>
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente" onRowClick={openDetail} />
      {selected && (
        <DemandeModalShell demande={selected} visible={detailOpen} onClose={closeDetail}
          title={title}
          footer={<>
            <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={closeDetail} />
            <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
              onClick={() => setShowReject(true)} />
            <ActionButton label={validateLabel} icon={cilCheckAlt} color={validateColor as any}
              onClick={() => run(validateAction)} />
          </>}>
          <DemandeDetailBase demande={selected} logs={logs} />
        </DemandeModalShell>
      )}
      {selected && (
        <MotifModal visible={showReject} title="Rejeter — retour secrétaire"
          confirmLabel="Rejeter" confirmColor="danger"
          onClose={() => setShowReject(false)}
          onConfirm={async motif => { setShowReject(false); await run(rejectAction, { motif }) }} />
      )}
    </DashboardShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ChefDivisionDashboard.tsx — utilise SimpleTransmitDashboard
// ─────────────────────────────────────────────────────────────────────────────
export const ChefDivisionDashboard = () => (
  <SimpleTransmitDashboard
    title="Validation Division"
    subtitle="Responsable de Division"
    statusKey="chef_division_review"
    validateAction="chef_division_validate"
    rejectAction="chef_division_reject"
    validateLabel="Valider → Chef CAP"
  />
)

// ─────────────────────────────────────────────────────────────────────────────
// SecretaireDaDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const SecretaireDaDashboard = () => (
  <SimpleTransmitDashboard
    title="Transmission — Direction Adjointe"
    subtitle="Secrétariat de la Direction Adjointe"
    statusKey="secretaire_da_review"
    validateAction="secretaire_da_transmit"
    rejectAction="secretaire_da_reject"
    validateLabel="Transmettre à la Directrice Adjointe"
    validateColor="primary"
  />
)

// ─────────────────────────────────────────────────────────────────────────────
// SecretaireDirecteurDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const SecretaireDirecteurDashboard = () => (
  <SimpleTransmitDashboard
    title="Transmission — Directeur"
    subtitle="Secrétariat du Directeur"
    statusKey="secretaire_directeur_review"
    validateAction="secretaire_directeur_transmit"
    rejectAction="secretaire_directeur_reject"
    validateLabel="Transmettre au Directeur"
    validateColor="primary"
  />
)
