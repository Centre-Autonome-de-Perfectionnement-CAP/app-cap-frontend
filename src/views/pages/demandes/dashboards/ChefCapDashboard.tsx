// src/views/pages/demandes/dashboards/ChefCapDashboard.tsx
import { useState } from 'react'
import { CButton, CAlert, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilPen, cilTask, cilCheck } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, ReferenceCell, EtudiantCell, TypeCell, DateCell,
} from '../components'
import type { ColumnDef } from '../components'
import type { DocumentRequest } from '@/types/document-request.types'

type CapChoice = 'paraphe' | 'signature'

const CHOICES: {
  value: CapChoice
  label: string
  desc: string
  color: string
  nextLabel: string
  icon: object
}[] = [
  {
    value: 'paraphe',
    label: 'Parapher',
    color: '#7c3aed',
    icon: cilPen,
    nextLabel: 'Parapher et transmettre à la Direction',
    desc: "Le document passera ensuite chez la Directrice Adjointe, puis le Directeur.",
  },
  {
    value: 'signature',
    label: 'Signer',
    color: '#10b981',
    icon: cilCheck,
    nextLabel: 'Signer — Document prêt immédiatement',
    desc: "Le document est validé directement et sera immédiatement prêt à retirer.",
  },
]

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [choice,        setChoice]        = useState<CapChoice>('paraphe')
  const [confirmed,     setConfirmed]     = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModal,   setRejectModal]   = useState(false)
  const selectedChoice = CHOICES.find(c => c.value === choice)!

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setActionLoading(false); setConfirmed(false) }
  }

  const btnActive = confirmed && !actionLoading

  const footer = (<>
    <CButton color="secondary" variant="ghost" onClick={onClose} disabled={actionLoading}>Fermer</CButton>
    <CButton color="danger" variant="outline" onClick={() => setRejectModal(true)} disabled={actionLoading}>
      <CIcon icon={cilX} className="me-1" />Rejeter
    </CButton>
    <CButton
      style={{
        background: btnActive ? selectedChoice.color : '#d1d5db',
        borderColor: btnActive ? selectedChoice.color : '#d1d5db',
        color: 'white',
        transition: 'all 0.2s',
      }}
      onClick={() => run('chef_cap_sign', { signature_type: choice })}
      disabled={!btnActive}
    >
      {actionLoading
        ? <><CSpinner size="sm" className="me-1" />En cours…</>
        : <><CIcon icon={selectedChoice.icon} className="me-1" />{selectedChoice.nextLabel}</>}
    </CButton>
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose} title="Traitement — Chef CAP" footer={footer}>
      <DemandeDetailBase demande={demande}>
        {/* Sélection paraphe/signature */}
        <div className="mt-4">
          <p className="fw-semibold mb-3" style={{ fontSize: '0.9rem' }}>
            Quelle action souhaitez-vous effectuer ?
          </p>
          <div className="d-flex flex-column gap-2">
            {CHOICES.map(opt => (
              <div
                key={opt.value}
                onClick={() => { setChoice(opt.value); setConfirmed(false) }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  border: `2px solid ${choice === opt.value ? opt.color : '#e5e7eb'}`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  background: choice === opt.value ? opt.color + '0d' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                {/* Radio visuel */}
                <div style={{
                  marginTop: 2, width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${choice === opt.value ? opt.color : '#d1d5db'}`,
                  background: choice === opt.value ? opt.color : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {choice === opt.value && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                  )}
                </div>
                <div>
                  <div className="fw-bold mb-1" style={{ color: choice === opt.value ? opt.color : '#111827' }}>
                    <CIcon icon={opt.icon} className="me-1" style={{ width: 14 }} />
                    {opt.label}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CAlert color="warning" className="mt-4 py-2 small mb-0">
          <strong>Attention :</strong> Votre décision est définitive. En cas de rejet, le dossier retourne à la secrétaire.
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
      confirmLabel="Rejeter"
      confirmColor="danger"
      placeholder="Indiquer le motif…"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('chef_cap_reject', { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const ChefCapDashboard = () => {
  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const columns: ColumnDef[] = [
    { header: 'Référence', render: d => <ReferenceCell d={d} /> },
    { header: 'Étudiant',  render: d => <EtudiantCell d={d} showDept /> },
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
      title="Documents à traiter"
      subtitle="Chef CAP"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      stats={[{ key: 'total', label: 'Documents à traiter', color: '#0ea5e9', bg: '#f0f9ff' }]}
      counts={{ total: demandes.length }}
    >
      <DemandeTable
        demandes={demandes}
        loading={loading}
        columns={columns}
        emptyMessage="Aucun document en attente de traitement"
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
