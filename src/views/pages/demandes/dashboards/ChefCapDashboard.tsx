// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx
// Nouveau circuit : reçoit de Resp. Division → paraphe → Sec. Dir. Adjointe
//                                             → signature → ready (direct)

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { cilX, cilPen, cilCheck } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, RadioCard, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

type CapChoice = 'paraphe' | 'signature'

const CAP_CHOICES: {
  value: CapChoice; label: string; desc: string; color: string; nextLabel: string; icon: object
}[] = [
  {
    value: 'paraphe',
    label: 'Parapher',
    color: '#7c3aed',
    icon: cilPen,
    nextLabel: 'Parapher et transmettre à la Sec. Dir. Adjointe',
    desc: 'Le dossier passera ensuite chez la Sec. Dir. Adjointe, puis la Directrice Adjointe, la Sec. Directeur et enfin le Directeur.',
  },
  {
    value: 'signature',
    label: 'Signer',
    color: '#059669',
    icon: cilCheck,
    nextLabel: 'Signer — Document prêt immédiatement',
    desc: 'Le document est validé directement et sera immédiatement prêt à retirer.',
  },
]

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [choice,        setChoice]        = useState<CapChoice>('paraphe')
  const [confirmed,     setConfirmed]     = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModal,   setRejectModal]   = useState(false)
  const selectedChoice = CAP_CHOICES.find(c => c.value === choice)!

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setActionLoading(false); setConfirmed(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={actionLoading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={actionLoading}
      onClick={() => setRejectModal(true)} />
    <ActionButton
      label={selectedChoice.nextLabel}
      icon={selectedChoice.icon}
      customBg={confirmed && !actionLoading ? selectedChoice.color : undefined}
      loading={actionLoading}
      disabled={!confirmed}
      onClick={() => run('chef_cap_sign', { signature_type: choice })}
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Traitement — Chef CAP" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <div style={{ marginTop: 20 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12 }}>
            Quelle action souhaitez-vous effectuer ?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CAP_CHOICES.map(opt => (
              <RadioCard
                key={opt.value}
                value={opt.value}
                selected={choice}
                onSelect={v => { setChoice(v as CapChoice); setConfirmed(false) }}
                label={opt.label}
                description={opt.desc}
                color={opt.color}
                icon={opt.icon}
              />
            ))}
          </div>
        </div>

        <CAlert color="warning" className="mt-4 py-2 small mb-0">
          <strong>Attention :</strong> Votre décision est définitive.
          En cas de rejet, le dossier retourne à la secrétaire.
        </CAlert>

        <ConfirmCheckbox
          id="confirm-cap"
          checked={confirmed}
          onChange={setConfirmed}
          label="J'ai vérifié le dossier et je confirme ma décision."
        />
      </DemandeDetailBase>
    </DemandeModalShell>

    <MotifModal
      visible={rejectModal}
      title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      placeholder="Indiquer le motif…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('chef_cap_reject', { motif }) }}
    />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} showDept /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const ChefCapDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Documents à traiter" subtitle="Chef CAP"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'chef_cap_review', label: 'Documents à traiter' }]}
      counts={{ chef_cap_review: demandes.length }}
    >
      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun document en attente de traitement" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ChefCapDashboard
