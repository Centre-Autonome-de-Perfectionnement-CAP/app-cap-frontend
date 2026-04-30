// src/views/pages/demandes/dashboards/ComptableDashboard.tsx

import { useState } from 'react'
import { CAlert, CBadge } from '@coreui/react'
import { cilCheckAlt, cilX, cilWarning } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  FinancialPanel, ActionButton, useActionColumns, ChefDivisionModal,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  RetourSecretaireModal,
} from '../components'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'

// ─── Bannière correction pour l'acteur ────────────────────────────────────────

const CorrectionBanner = ({ demande }: { demande: DocumentRequest }) => (
  <div style={{
    background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
    border: '2px solid #fcd34d',
    borderLeft: '5px solid #f59e0b',
    borderRadius: 12, padding: '18px 20px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{
        display: 'inline-flex', width: 28, height: 28, borderRadius: '50%',
        background: '#f97316', color: '#fff', fontSize: '0.9rem',
        fontWeight: 900, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>⟳</span>
      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#78350f' }}>
        Ce dossier est en circuit de correction
      </span>
      <CBadge color="warning" style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '5px 10px', color: '#fff' }}>
        Navette active
      </CBadge>
    </div>
    <div style={{ fontSize: '0.9rem', color: '#92400e', lineHeight: 1.7 }}>
      Vérifiez et corrigez ce dossier, puis cliquez sur{' '}
      <strong>"Renvoyer à la Secrétaire"</strong> en indiquant ce que vous avez fait.
      Votre commentaire est obligatoire.
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(255,255,255,0.75)', border: '1px solid #fcd34d',
        fontSize: '0.87rem', color: '#78350f',
      }}>
        <strong>Motif signalé :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,          setLoading]          = useState(false)
  const [rejectModal,      setRejectModal]      = useState(false)
  const [retourModal,      setRetourModal]      = useState(false)
  const [chefDivModal,     setChefDivModal]     = useState(false)
  const [chefDivFlagModal, setChefDivFlagModal] = useState(false)
  const [pendingFlagType,  setPendingFlagType]  = useState<ChefDivisionType | null>(null)
  const [flagMotifModal,   setFlagMotifModal]   = useState(false)

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const inCircuit = !!demande.is_in_correction_circuit

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />

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
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={loading} onClick={() => setRejectModal(true)} />
        <ActionButton label="Valider → Resp. Division" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => setChefDivModal(true)} />
        <ActionButton label="Valider sous réserve" icon={cilWarning} color="warning" variant="outline"
          loading={loading} onClick={() => setChefDivFlagModal(true)} />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Vérification financière" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <CorrectionBanner demande={demande} />
        ) : (
          <>
            <FinancialPanel demande={demande} />
            <CAlert color="info" className="mt-3 py-2 small">
              <strong>Information :</strong> Vérifiez la situation financière avant de valider.
              Sélectionnez ensuite le Responsable Division concerné.
            </CAlert>
          </>
        )}
      </DemandeDetailBase>
    </DemandeModalShell>

    <RetourSecretaireModal
      visible={retourModal} demande={demande} loading={loading}
      onClose={() => setRetourModal(false)}
      onConfirm={async comment => { setRetourModal(false); await run('return_to_secretaire', { comment }) }}
    />

    <ChefDivisionModal visible={chefDivModal} onClose={() => setChefDivModal(false)}
      onConfirm={(type: ChefDivisionType) => { setChefDivModal(false); run('comptable_validate', { chef_division_type: type }) }} />

    <ChefDivisionModal visible={chefDivFlagModal} onClose={() => setChefDivFlagModal(false)}
      onConfirm={(type: ChefDivisionType) => { setChefDivFlagModal(false); setPendingFlagType(type); setFlagMotifModal(true) }} />

    <MotifModal visible={flagMotifModal} title="Validation sous réserve"
      confirmLabel="Valider" confirmColor="warning" placeholder="Commentaire de réserve…"
      onClose={() => { setFlagMotifModal(false); setPendingFlagType(null) }}
      onConfirm={async motif => {
        setFlagMotifModal(false)
        await run('comptable_validate_flagged', { chef_division_type: pendingFlagType, motif })
        setPendingFlagType(null)
      }} />

    <MotifModal visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger" placeholder="Décrire le problème financier…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('comptable_reject', { motif }) }} />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ComptableDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length

  return (
    <DashboardShell title="Vérification financière" subtitle="Comptabilité"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'comptable_review', label: 'Dossiers à vérifier' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'En correction ↺',
          color: '#ea580c', bg: '#fff7ed', urgent: true,
        }] : []),
      ]}
      counts={{ comptable_review: demandes.length, correction: correctionCount }}>

      {correctionCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
          border: '1.5px solid #fed7aa', borderRadius: '10px 10px 0 0',
          padding: '12px 20px', borderBottom: '1px solid #fde68a',
        }}>
          <CIcon icon={cilWarning} style={{ width: 18, color: '#f97316' }} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#78350f' }}>
            {correctionCount} dossier{correctionCount > 1 ? 's' : ''} en circuit de correction — action requise
          </span>
        </div>
      )}

      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun dossier en attente de vérification" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ComptableDashboard
