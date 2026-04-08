// src/views/pages/demandes/dashboards/SecretaireDashboard.tsx
// Dashboard secrétaire — design moderne, icônes CoreUI, sans émojis, fix openDetail

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckAlt, cilX, cilSend, cilReload,
  cilInbox, cilEnvelopeLetter, cilTask, cilLoop, cilUser,
  cilDollar, cilPen, cilBan, cilFolder, cilWarning,
} from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DashboardShell, DemandeTable, DemandeModalShell, DemandeDetailBase,
  ChefDivisionModal, ResendModal,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, StatutCell,
} from '../components'
import type { ColumnDef } from '../components'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'

// ─── Configuration des onglets ────────────────────────────────────────────────

interface TabConfig {
  key: string
  label: string
  color: string
  bg: string
  icon: any
}

const TABS: TabConfig[] = [
  { key: 'pending',                  label: 'Nouvelles',     color: '#f59e0b', bg: '#fffbeb', icon: cilInbox },
  { key: 'secretaire_review',        label: 'En cours',      color: '#3b82f6', bg: '#eff6ff', icon: cilEnvelopeLetter },
  { key: 'chef_division_review',     label: 'Responsable Division', color: '#8b5cf6', bg: '#f5f3ff', icon: cilUser },
  { key: 'comptable_review',         label: 'Comptabilité',  color: '#06b6d4', bg: '#ecfeff', icon: cilDollar },
  { key: 'chef_cap_review',          label: 'Chef CAP',      color: '#0ea5e9', bg: '#f0f9ff', icon: cilPen },
  { key: 'directeur_adjoint_review', label: 'Dir. Adjoint',  color: '#7c3aed', bg: '#f5f3ff', icon: cilTask },
  { key: 'directeur_review',         label: 'Directeur',     color: '#dc2626', bg: '#fef2f2', icon: cilTask },
  { key: 'ready',                    label: 'Prêts',         color: '#10b981', bg: '#ecfdf5', icon: cilCheckAlt },
  { key: 'secretaire_correction',    label: 'À corriger',    color: '#ef4444', bg: '#fef2f2', icon: cilWarning },
  { key: 'delivered',                label: 'Archivés',      color: '#6b7280', bg: '#f9fafb', icon: cilFolder },
  { key: 'rejected',                 label: 'Rejetés',       color: '#1f2937', bg: '#f3f4f6', icon: cilBan },
]

const STAT_TABS = [
  { key: 'pending',               label: 'Nouvelles demandes', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'secretaire_correction', label: 'À corriger',         color: '#ef4444', bg: '#fef2f2' },
  { key: 'ready',                 label: 'Prêts à retirer',    color: '#10b981', bg: '#ecfdf5' },
  { key: 'delivered',             label: 'Archivés',           color: '#6b7280', bg: '#f9fafb' },
]

// ─── Colonnes du tableau ──────────────────────────────────────────────────────

const makeColumns = (onOpen: (d: DocumentRequest) => void): ColumnDef[] => [
  { header: 'Référence', render: d => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: d => <EtudiantCell d={d} /> },
  { header: 'Type',      render: d => <TypeCell d={d} /> },
  { header: 'Date',      render: d => <DateCell d={d} /> },
  { header: 'Statut',    render: d => <StatutCell d={d} /> },
  {
    header: '', width: 50,
    render: d => (
      <td>
        <CButton color="primary" size="sm" variant="ghost"
          onClick={e => { e.stopPropagation(); onOpen(d) }}>
          <CIcon icon={cilTask} />
        </CButton>
      </td>
    ),
  },
]

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
      <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading}>Fermer</CButton>

      {s === 'pending' && (
        <CButton color="success" onClick={() => run('secretaire_accept')} disabled={loading}>
          {loading
            ? <CSpinner size="sm" />
            : <><CIcon icon={cilCheckAlt} className="me-1" />Prendre en charge</>}
        </CButton>
      )}

      {s === 'secretaire_review' && (<>
        <CButton color="danger" variant="outline" onClick={() => setRejectModal(true)} disabled={loading}>
          <CIcon icon={cilX} className="me-1" />Rejeter
        </CButton>
        <CButton color="primary" onClick={() => setChefDivModal(true)} disabled={loading}>
          <CIcon icon={cilSend} className="me-1" />Envoyer au Responsable Division
        </CButton>
      </>)}

      {s === 'secretaire_correction' && (<>
        <CButton color="danger" onClick={() => setRejectFinalModal(true)} disabled={loading}>
          <CIcon icon={cilX} className="me-1" />Rejeter définitivement
        </CButton>
        <CButton color="primary" onClick={() => setResendModal(true)} disabled={loading}>
          <CIcon icon={cilReload} className="me-1" />Renvoyer
        </CButton>
      </>)}

      {s === 'ready' && (
        <CButton color="success" onClick={() => run('secretaire_deliver')} disabled={loading}>
          {loading
            ? <CSpinner size="sm" />
            : <><CIcon icon={cilCheckAlt} className="me-1" />Marquer comme retiré</>}
        </CButton>
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
      onConfirm={(type: ChefDivisionType) => {
        setChefDivModal(false)
        run('secretaire_send_chef_division', { chef_division_type: type })
      }}
    />

    <ResendModal
      demande={demande}
      visible={resendModal}
      onClose={() => setResendModal(false)}
      onConfirm={(resendTo, chefDivType) => {
        setResendModal(false)
        run('secretaire_resend', { resend_to: resendTo, chef_division_type: chefDivType })
      }}
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

// ─── Onglets de navigation ────────────────────────────────────────────────────

const TabBar = ({
  tabs, activeKey, counts, onSelect,
}: {
  tabs: TabConfig[]
  activeKey: string
  counts: Record<string, number>
  onSelect: (key: string) => void
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 0' }}>
    {tabs.map(tab => {
      const isActive = activeKey === tab.key
      const count = counts[tab.key] || 0
      return (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: isActive ? 600 : 400,
            border: `1.5px solid ${isActive ? tab.color : '#e5e7eb'}`,
            background: isActive ? tab.color : 'white',
            color: isActive ? 'white' : '#6b7280',
            transition: 'all 0.15s ease',
            boxShadow: isActive ? `0 2px 8px ${tab.color}44` : 'none',
          }}
        >
          <CIcon icon={tab.icon} style={{ width: 13, height: 13 }} />
          <span>{tab.label}</span>
          {count > 0 && (
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.25)' : tab.color + '20',
              color: isActive ? 'white' : tab.color,
              borderRadius: 10, padding: '0 6px',
              fontSize: '0.68rem', fontWeight: 700, minWidth: 18, textAlign: 'center',
            }}>
              {count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

// ─── Vue principale ───────────────────────────────────────────────────────────

const SecretaireDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pending'

  const {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail, handleAction,
  } = useDemandesDashboard()

  const counts = TABS.reduce((acc, tab) => {
    acc[tab.key] = demandes.filter(d => d.status === tab.key).length
    return acc
  }, {} as Record<string, number>)

  const columns = makeColumns(openDetail)

  const tabBar = (
    <TabBar
      tabs={TABS}
      activeKey={activeTab}
      counts={counts}
      onSelect={key => setSearchParams({ tab: key })}
    />
  )

  return (
    <DashboardShell
      title="Gestion des demandes"
      subtitle="Tableau de bord — Secrétariat"
      search={filters.search ?? ''}
      onSearchChange={v => setFilters({ ...filters, search: v })}
      typeFilter={filters.type ?? ''}
      onTypeChange={v => setFilters({ ...filters, type: v })}
      showTypeFilter
      stats={STAT_TABS.map(s => ({
        ...s,
        onClick: () => setSearchParams({ tab: s.key }),
      }))}
      counts={counts}
      headerExtra={tabBar}
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
