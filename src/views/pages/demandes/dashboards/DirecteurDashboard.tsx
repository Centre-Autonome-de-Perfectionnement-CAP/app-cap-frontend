// src/views/pages/demandes/dashboards/DirecteurDashboard.tsx

import { useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader } from '@coreui/react'
import { cilX, cilCheck } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ConfirmCheckbox, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
  DemandeSearchBar,
} from '../components'
import { STATUS_COLORS } from '../components'
import DirectionShell from '../components/layout/DirectionShell'
import type { DocumentRequest } from '@/types/document-request.types'

import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const palette = STATUS_COLORS['directeur_review']

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false); setConfirmed(false) }
  }

  // Dans DirecteurDashboard.tsx — remplacer uniquement le footer du DetailModal

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
      disabled={loading} onClick={() => setRejectModal(true)} />
    <ActionButton
      label="Signer — Document prêt"
      icon={cilCheck}
      customBg={confirmed && !loading ? palette.color : undefined}
      loading={loading}
      disabled={!confirmed}
      onClick={() => run('directeur_sign')}
    />
    {/* ── AJOUT ── */}
    <FlaggedValidationAction
      action="directeur_sign_flagged"
      loading={loading}
      disabled={!confirmed}
      run={run}
      label="Signer sous réserve"
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Signature — Directeur" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="warning" className="mt-3 py-2 small">
          <strong>Attention :</strong> En signant, le document est marqué prêt à retirer. Action définitive.
        </CAlert>
        <ConfirmCheckbox
          id="confirm-directeur"
          checked={confirmed}
          onChange={setConfirmed}
          label={<>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>Directeur</strong>.</>}
        />
      </DemandeDetailBase>
    </DemandeModalShell>
    <MotifModal
      visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('directeur_reject', { motif }) }}
    />
  </>)
}

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant', render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type', render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Type signature', render: (d: DocumentRequest) => <SignatureTypeCell d={d} /> },
  { header: 'Date', render: (d: DocumentRequest) => <DateCell d={d} /> },
]

const DirecteurDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DirectionShell title="Gestion des demandes" subtitle="Directeur">
      <CCard className="border-0" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 14 }}>
        <CCardHeader className="bg-white" style={{
          borderBottom: '1px solid #f1f5f9', borderRadius: '14px 14px 0 0',
          padding: '16px 20px 12px',
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                Documents à signer
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                {demandes.length} dossier{demandes.length > 1 ? 's' : ''} en attente de signature
              </div>
            </div>
            <DemandeSearchBar
              search={filters.search ?? ''} onSearchChange={v => setFilters({ ...filters, search: v })}
            />
          </div>
        </CCardHeader>
        <CCardBody style={{ padding: 0 }}>
          <DemandeTable
            demandes={demandes} loading={loading} columns={columns}
            emptyMessage="Aucun document en attente de signature"
            onRowClick={openDetail}
          />
        </CCardBody>
      </CCard>

      {selected && (
        <DetailModal demande={selected} visible={detailOpen}
          onClose={closeDetail} onAction={handleAction} />
      )}
    </DirectionShell>
  )
}

export default DirecteurDashboard
