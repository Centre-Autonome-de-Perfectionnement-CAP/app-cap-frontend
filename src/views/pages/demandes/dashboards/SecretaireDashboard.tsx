// src/views/pages/demandes/dashboards/SecretaireDashboard.tsx

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilSend, cilReload, cilWarning } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ChefDivisionModal, ResendModal, TabBar, ActionButton, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, StatutCell,
  SECRETAIRE_TABS, SECRETAIRE_STAT_TABS,
} from '../components'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
}) => {
  const [loading,          setLoading]          = useState(false)
  const [chefDivModal,     setChefDivModal]     = useState(false)
  const [resendModal,      setResendModal]      = useState(false)
  const [rejectModal,      setRejectModal]      = useState(false)
  const [rejectFinalModal, setRejectFinalModal] = useState(false)
  const s = demande.status

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try { await onAction(action, extra) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const footer = (
    <>
      <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={loading} />

      {s === 'pending' && (
        <ActionButton
          label="Prendre en charge"
          icon={cilCheckAlt}
          color="success"
          loading={loading}
          onClick={() => run('secretaire_accept')}
        />
      )}

      {s === 'secretaire_review' && (<>
        <ActionButton label="Rejeter" icon={cilX} color="danger" variant="outline" disabled={loading}
          onClick={() => setRejectModal(true)} />
        <ActionButton label="Envoyer au Responsable Division" icon={cilSend} color="primary" disabled={loading}
          onClick={() => setChefDivModal(true)} />
      </>)}

      {s === 'secretaire_correction' && (<>
        {/* Rejeter définitivement : fond rouge vif + texte blanc */}
        <ActionButton
          label="Rejeter définitivement"
          icon={cilX}
          customBg="#dc2626"
          disabled={loading}
          onClick={() => setRejectFinalModal(true)}
        />
        <ActionButton label="Renvoyer" icon={cilReload} color="primary" disabled={loading}
          onClick={() => setResendModal(true)} />
      </>)}

      {s === 'ready' && (
        <ActionButton
          label="Marquer comme retiré"
          icon={cilCheckAlt}
          color="success"
          loading={loading}
          onClick={() => run('secretaire_deliver')}
        />
      )}
    </>
  )

  return (<>
    <DemandeModalShell demande={demande} visible={visible} onClose={onClose} footer={footer}>
      <DemandeDetailBase demande={demande} />
    </DemandeModalShell>

    <ChefDivisionModal
      visible={chefDivModal}
      onClose={() => setChefDivModal(false)}
      onConfirm={(type: ChefDivisionType) => { setChefDivModal(false); run('secretaire_send_chef_division', { chef_division_type: type }) }}
    />

    <ResendModal
      demande={demande}
      visible={resendModal}
      onClose={() => setResendModal(false)}
      onConfirm={(resendTo, chefDivType) => { setResendModal(false); run('secretaire_resend', { resend_to: resendTo, chef_division_type: chefDivType }) }}
    />

    <MotifModal
      visible={rejectModal}
      title="Rejeter la demande"
      confirmLabel="Rejeter"
      confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('secretaire_reject', { motif }) }}
    />

    <MotifModal
      visible={rejectFinalModal}
      title="Rejeter définitivement"
      confirmLabel="Rejeter définitivement"
      confirmColor="danger"
      onClose={() => setRejectFinalModal(false)}
      onConfirm={async motif => { setRejectFinalModal(false); await run('secretaire_reject_final', { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
  { header: 'Statut',    render: (d: DocumentRequest) => <StatutCell d={d} /> },
]

const SecretaireDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pending'

  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction } =
    useDemandesDashboard()

  const counts = SECRETAIRE_TABS.reduce((acc, tab) => {
    acc[tab.key] = demandes.filter(d => d.status === tab.key).length
    return acc
  }, {} as Record<string, number>)

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  return (
    <DashboardShell
      title="Gestion des demandes"
      subtitle="Tableau de bord — Secrétariat"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      typeFilter={filters.type ?? ''}
      onTypeChange={v => setFilters({ ...filters, type: v })}
      showTypeFilter
      stats={SECRETAIRE_STAT_TABS.map(s => ({
        ...s,
        onClick: () => setSearchParams({ tab: s.key }),
      }))}
      counts={counts}
      headerExtra={
        <TabBar
          tabs={SECRETAIRE_TABS}
          activeKey={activeTab}
          counts={counts}
          onSelect={key => setSearchParams({ tab: key })}
        />
      }
    >
      <DemandeTable
        demandes={demandes.filter(d => d.status === activeTab)}
        loading={loading}
        columns={columns}
        emptyMessage="Aucune demande dans cette catégorie"
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

export default SecretaireDashboard
