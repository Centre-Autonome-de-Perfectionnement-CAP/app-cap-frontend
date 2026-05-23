// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx

import { useState } from 'react'
import { CAlert, CBadge } from '@coreui/react'
import { cilX, cilPen, cilCheck, cilWarning } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, RadioCard, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  RetourSecretaireModal,
} from '../components'
import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'
import type { DocumentRequest } from '@/types/document-request.types'

const ICON_MAP: Record<string, object> = { cilPen, cilCheck, cilX }

type CapChoice = 'paraphe' | 'signature'

const CAP_CHOICES: { value: CapChoice; label: string; desc: string; color: string; nextLabel: string; icon: string }[] = [
  {
    value: 'paraphe', label: 'Parapher', color: '#7c3aed', icon: 'cilPen',
    nextLabel: 'Parapher et transmettre à la Sec. Dir. Adjointe',
    desc: 'Le dossier passera ensuite chez la Sec. Dir. Adjointe, puis la Directrice Adjointe, la Sec. Directeur et enfin le Directeur.',
  },
  {
    value: 'signature', label: 'Signer', color: '#059669', icon: 'cilCheck',
    nextLabel: 'Signer — Document prêt immédiatement',
    desc: 'Le document est validé directement et sera immédiatement prêt à retirer.',
  },
]

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
      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#78350f' }}>
        Traitement en mode correction
      </span>
      <CBadge color="warning" style={{ marginLeft: 'auto', fontSize: '0.875rem', padding: '6px 12px', color: '#fff' }}>
        Navette active
      </CBadge>
    </div>
    <div style={{ fontSize: '0.95rem', color: '#92400e', lineHeight: 1.7 }}>
      Ce dossier est en cours de correction. Veuillez vérifier les modifications, puis
      cliquez sur <strong>"Renvoyer à la Secrétaire"</strong> avec un commentaire explicatif.
      <br/>
      <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ Un commentaire détaillé est requis.</span>
    </div>
    {demande.rejected_reason && (
      <div style={{
        marginTop: 14, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.85)', border: '1px solid #fcd34d',
        fontSize: '0.92rem', color: '#78350f', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <strong>Problème initial :</strong> {demande.rejected_reason}
      </div>
    )}
  </div>
)

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [choice,       setChoice]       = useState<CapChoice>('paraphe')
  const [confirmed,    setConfirmed]    = useState(false)
  const [actionLoading,setActionLoading]= useState(false)
  const [rejectModal,  setRejectModal]  = useState(false)
  const [retourModal,  setRetourModal]  = useState(false)
  const selectedChoice = CAP_CHOICES.find(c => c.value === choice)!
  const inCircuit = !!demande.is_in_correction_circuit

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setActionLoading(false); setConfirmed(false) }
  }

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={actionLoading} />

    {inCircuit ? (
      <ActionButton
        label="Renvoyer à la Secrétaire"
        icon={cilWarning}
        color="warning"
        loading={actionLoading}
        onClick={() => setRetourModal(true)}
      />
    ) : (
      <>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={actionLoading} onClick={() => setRejectModal(true)} />
        <ActionButton
          label={selectedChoice.nextLabel} icon={selectedChoice.icon}
          customBg={confirmed && !actionLoading ? selectedChoice.color : undefined}
          loading={actionLoading} disabled={!confirmed}
          onClick={() => run('chef_cap_sign', { signature_type: choice })}
        />
        <FlaggedValidationAction
          action="chef_cap_sign_flagged" loading={actionLoading} disabled={!confirmed}
          run={async (action, payload) => run(action, { ...payload, signature_type: choice })}
          label="Signer sous réserve"
        />
      </>
    )}
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Traitement — Chef CAP" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {inCircuit ? (
          <CorrectionBanner demande={demande} />
        ) : (
          <>
            <div style={{ marginTop: 20 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 16 }}>
                Quelle action souhaitez-vous effectuer ?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CAP_CHOICES.map(opt => (
                  <RadioCard key={opt.value} value={opt.value} selected={choice}
                    onSelect={v => { setChoice(v as CapChoice); setConfirmed(false) }}
                    label={opt.label} description={opt.desc} color={opt.color} icon={ICON_MAP[opt.icon]} />
                ))}
              </div>
            </div>
            <CAlert color="warning" className="mt-4 py-3" style={{ borderRadius: 12, border: 'none', background: '#fffbeb', color: '#92400e' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Attention :</div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>Votre décision est définitive et impactera la suite du workflow.</div>
            </CAlert>
            <div style={{ padding: '0 4px' }}>
              <ConfirmCheckbox id="confirm-cap" checked={confirmed} onChange={setConfirmed}
                label="J'ai vérifié le dossier et je confirme ma décision." />
            </div>
          </>
        )}
      </DemandeDetailBase>
    </DemandeModalShell>

    <RetourSecretaireModal
      visible={retourModal} demande={demande} loading={actionLoading}
      onClose={() => setRetourModal(false)}
      onConfirm={async comment => { setRetourModal(false); await run('return_to_secretaire', { comment }) }}
    />

    <MotifModal visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger" placeholder="Indiquer le motif…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('chef_cap_reject', { motif }) }} />
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

  const correctionCount = demandes.filter(d => !!d.is_in_correction_circuit).length

  return (
    <DashboardShell title="Documents à traiter" subtitle="Chef CAP"
      search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[
        { key: 'cap_manager_review', label: 'Documents à traiter' },
        ...(correctionCount > 0 ? [{
          key: 'correction', label: 'En correction ↺',
          color: '#ea580c', bg: '#fff7ed', urgent: true,
        }] : []),
      ]}
      counts={{ cap_manager_review: demandes.length, correction: correctionCount }}>

      {correctionCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
          border: '1.5px solid #fed7aa', borderRadius: '12px 12px 0 0',
          padding: '14px 24px', borderBottom: '1px solid #fde68a',
        }}>
          <CIcon icon={cilWarning} style={{ width: 20, color: '#f97316' }} className="animate-pulse" />
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#78350f' }}>
            {correctionCount} dossier{correctionCount > 1 ? 's' : ''} en attente de correction navette
          </span>
        </div>
      )}

      <DemandeTable demandes={demandes} loading={loading} columns={columns}
        emptyMessage="Aucun document en attente de traitement" onRowClick={openDetail} />
      {selected && (
        <DetailModal demande={selected} visible={detailOpen} onClose={closeDetail} onAction={handleAction} />
      )}
    </DashboardShell>
  )
}

export default ChefCapDashboard
