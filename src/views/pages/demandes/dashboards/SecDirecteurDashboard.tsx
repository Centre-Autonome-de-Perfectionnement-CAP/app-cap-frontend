// src/views/pages/demandes/dashboards/SecDirecteurDashboard.tsx

import { useState, useEffect } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader } from '@coreui/react'
import { cilCheckAlt, cilX } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, SignatureTypeCell,
  DemandeSearchBar,
} from '../components'
import DirectionShell from '../components/layout/DirectionShell'
import DirectionStatBar from '../components/layout/DirectionStatBar'
import type { DocumentRequest } from '@/types/document-request.types'
import documentRequestService from '@/services/document-request.service'

import FlaggedValidationAction from '../components/workflow/FlaggedValidationAction'

interface DirectionStats {
  total_in_progress: number
  pending_at_my_level: number
  total_validated: number
  total_rejected: number
}

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest; visible: boolean; onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  // Dans SecDirecteurDashboard.tsx — remplacer uniquement le footer du DetailModal

  const footer = (<>
    <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />
    <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
      disabled={loading} onClick={() => setRejectModal(true)} />
    <ActionButton label="Transmettre vers Directeur" icon={cilCheckAlt} color="success"
      loading={loading} onClick={() => run('sec_directeur_transmit')} />
    {/* ── AJOUT ── */}
    <FlaggedValidationAction
      action="sec_directeur_transmit_flagged"
      loading={loading}
      run={run}
      label="Transmettre sous réserve"
    />
  </>)

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose}
      title="Transmission — Sec. Directeur" footer={footer}>
      <DemandeDetailBase demande={demande}>
        <CAlert color="info" className="mt-3 py-2 small">
          <strong>Information :</strong> En transmettant, le dossier passe au Directeur pour signature finale.
        </CAlert>
      </DemandeDetailBase>
    </DemandeModalShell>
    <MotifModal
      visible={rejectModal} title="Rejeter — retour à la secrétaire"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('sec_directeur_reject', { motif }) }}
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

const SecDirecteurDashboard = () => {
  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const [stats, setStats] = useState<DirectionStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    setStatsLoading(true)
    documentRequestService.getStats?.()
      .then(res => setStats(res.data ?? null))
      .catch(() => { })
      .finally(() => setStatsLoading(false))
  }, [demandes])

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DirectionShell title="Gestion des demandes" subtitle="Secrétariat — Directeur">
      <DirectionStatBar stats={stats} loading={statsLoading} />

      <CCard className="border-0" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 14 }}>
        <CCardHeader className="bg-white" style={{
          borderBottom: '1px solid #f1f5f9', borderRadius: '14px 14px 0 0',
          padding: '16px 20px 12px',
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                Documents à transmettre
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                {demandes.length} dossier{demandes.length > 1 ? 's' : ''} en attente
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
            emptyMessage="Aucun document en attente de transmission"
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

export default SecDirecteurDashboard
