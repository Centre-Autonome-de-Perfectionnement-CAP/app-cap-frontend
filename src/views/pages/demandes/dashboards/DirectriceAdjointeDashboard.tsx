// src/views/pages/demandes/dashboards/DirectriceAdjointeDashboard.tsx

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
  const palette = STATUS_COLORS['directrice_adjointe_review']

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoading(false); setConfirmed(false) }
  }

  // Dans DirectriceAdjointeDashboard.tsx — remplacer uniquement le footer du DetailModal

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
      disabled={loading} onClick={() => setRejectModal(true)} />
    <ActionButton
      label="Signer — Transmettre au Sec. Directeur"
      icon={cilCheck}
      customBg={confirmed && !loading ? palette.color : undefined}
      loading={loading}
      disabled={!confirmed}
      onClick={() => run('directrice_adjointe_sign')}
    />
    {/* ── AJOUT ── */}
    <FlaggedValidationAction
      action="directrice_adjointe_sign_flagged"
      loading={loading}
      disabled={!confirmed}
      run={run}
      label="Signer sous réserve"
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Signature — Directrice Adjointe" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="warning" className="mt-3 py-2 small">
          <strong>Attention :</strong> En signant, le dossier passe à la Sec. Directeur. Cette action est définitive.
        </CAlert>
        <ConfirmCheckbox
          id="confirm-directrice-adjointe"
          checked={confirmed}
          onChange={setConfirmed}
          label={<>J'ai examiné ce dossier et j'appose ma signature en tant que <strong>Directrice Adjointe</strong>.</>}
        />
      </DemandeDetailBase>
    </DemandeModalShell>
    <MotifModal
      visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('directrice_adjointe_reject', { motif }) }}
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

const DirectriceAdjointeDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DirectionShell title="Gestion des demandes" subtitle="Directrice Adjointe" hideHeader>
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

export default DirectriceAdjointeDashboard
