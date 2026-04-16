// src/views/pages/demandes/dashboards/SecretaireDashboard.tsx

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilInbox, cilWarning, cilFlagAlt, cilCheckAlt, cilFolder,
  cilX, cilReload,
} from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ResendModal, TabBar, ActionButton, StatCard, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, StatutCell,
  SECRETAIRE_TABS,
  DemandeSearchBar,
} from '../components'
import { STATUS_COLORS } from '../constants/workflow'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction, onReload }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  onReload: () => Promise<void>
}) => {
  const [loading, setLoading] = useState(false)
  const [resendModal, setResendModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectFinalModal, setRejectFinalModal] = useState(false)
  const s = demande.status

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (
    <>
      <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />

      {s === 'pending' && (<>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline"
          disabled={loading} onClick={() => setRejectModal(true)} />
        <ActionButton label="Valider vers Comptable" icon={cilCheckAlt} color="primary"
          loading={loading} onClick={() => run('secretaire_validate')} />

      </>)}

      {s === 'secretaire_correction' && (<>
        <ActionButton label="Rejeter définitivement" icon={cilX} customBg="#dc2626"
          disabled={loading} onClick={() => setRejectFinalModal(true)} />
        <ActionButton label="Renvoyer" icon={cilReload} color="primary"
          disabled={loading} onClick={() => setResendModal(true)} />
      </>)}

      {s === 'ready' && (
        <ActionButton label="Marquer comme retiré" icon={cilCheckAlt} color="success"
          loading={loading} onClick={() => run('secretaire_deliver')} />
      )}
    </>
  )

  return (<>
    <DemandeModalShell
      demande={demande} visible={visible} onClose={onClose} footer={footer}
      canClearFlag
      onFlagCleared={async () => { await onReload() }}
    >
      <DemandeDetailBase demande={demande} />
    </DemandeModalShell>

    <ResendModal
      demande={demande} visible={resendModal}
      onClose={() => setResendModal(false)}
      onConfirm={(resendTo, chefDivType) => {
        setResendModal(false)
        run('secretaire_resend', { resend_to: resendTo, chef_division_type: chefDivType })
      }}
    />
    <MotifModal
      visible={rejectModal} title="Rejeter la demande"
      confirmLabel="Rejeter" confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('secretaire_reject', { motif }) }}
    />
    <MotifModal
      visible={rejectFinalModal} title="Rejeter définitivement"
      confirmLabel="Rejeter définitivement" confirmColor="danger"
      onClose={() => setRejectFinalModal(false)}
      onConfirm={async motif => { setRejectFinalModal(false); await run('secretaire_reject_final', { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant', render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type', render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date', render: (d: DocumentRequest) => <DateCell d={d} /> },
  { header: 'Statut', render: (d: DocumentRequest) => <StatutCell d={d} /> },
]

const STAT_DEFS = [
  {
    key: 'pending',
    label: 'Nouvelles demandes',
    urgent: true,
    icon: cilInbox,
  },
  {
    key: 'secretaire_correction',
    label: 'À corriger',
    urgent: true,
    icon: cilWarning,
  },
  {
    key: 'flagged',
    label: 'Réserves actives',
    urgent: true,
    icon: cilFlagAlt,
  },
  {
    key: 'ready',
    label: 'Prêts à retirer',
    urgent: false,
    icon: cilCheckAlt,
  },
  {
    key: 'delivered',
    label: 'Archivés',
    urgent: false,
    icon: cilFolder,
  },
]

const SecretaireDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pending'

  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction, reload } =
    useDemandesDashboard()

  const counts = SECRETAIRE_TABS.reduce((acc, tab) => {
    acc[tab.key] = demandes.filter(d => d.status === tab.key).length
    return acc
  }, {} as Record<string, number>)
  counts['flagged'] = demandes.filter(d => !!(d as any).has_flag).length
  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const visibleDemandes = activeTab === 'flagged'
    ? demandes.filter(d => !!(d as any).has_flag)
    : demandes.filter(d => d.status === activeTab)

  return (
    <div>
      {/* Stat cards — même hauteur, toutes identiques sauf animation */}
      <CRow className="mb-4 g-3">
        {STAT_DEFS.map(s => {
          const palette = STATUS_COLORS[s.key] ?? STATUS_COLORS['pending']
          return (
            <CCol key={s.key} md={Math.floor(12 / STAT_DEFS.length)} sm={6}>
              <StatCard
                label={s.label}
                count={counts[s.key] ?? 0}
                color={palette.color}
                bg={palette.bg}
                text={palette.text}
                urgent={s.urgent}
                icon={<CIcon icon={s.icon} style={{ width: 14 }} />}
                onClick={() => setSearchParams({ tab: s.key })}
              />
            </CCol>
          )
        })}
      </CRow>

      <CCard className="border-0" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 14 }}>
        <CCardHeader
          className="bg-white"
          style={{
            borderBottom: '1px solid #f1f5f9',
            borderRadius: '14px 14px 0 0',
            padding: '16px 20px 12px',
          }}
        >
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                Gestion des demandes
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                Tableau de bord — Secrétariat
              </div>
            </div>
            <DemandeSearchBar
              search={filters.search ?? ''}
              onSearchChange={v => setFilters({ ...filters, search: v })}
              typeFilter={filters.type}
              onTypeChange={v => setFilters({ ...filters, type: v })}
              showTypeFilter
            />
          </div>
          <TabBar
            tabs={SECRETAIRE_TABS}
            activeKey={activeTab}
            counts={counts}
            onSelect={key => setSearchParams({ tab: key })}
          />
        </CCardHeader>

        <CCardBody style={{ padding: 0 }}>
          <DemandeTable
            demandes={visibleDemandes}
            loading={loading}
            columns={columns}
            emptyMessage={
              activeTab === 'flagged'
                ? 'Aucun dossier avec réserve active'
                : 'Aucune demande dans cette catégorie'
            }
            onRowClick={openDetail}
          />
        </CCardBody>
      </CCard>

      {selected && (
        <DetailModal
          demande={selected}
          visible={detailOpen}
          onClose={closeDetail}
          onAction={handleAction}
          onReload={reload}
        />
      )}
    </div>
  )
}

export default SecretaireDashboard
