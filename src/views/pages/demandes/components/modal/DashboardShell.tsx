// src/views/pages/demandes/components/modal/DashboardShell.tsx
// Squelette commun : stat cards + CCard + header + recherche + slot contenu.
// REFONTE StatCards : colonnes adaptatives larges, espacement aéré, libellés non tronqués.

import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilDollar, cilUser, cilPen, cilTask, cilSend, cilInbox } from '@coreui/icons'
import StatCard from '../ui/StatCard'
import DemandeSearchBar from './DemandeSearchBar'
import { STATUS_COLORS } from '../../constants/workflow'

export interface StatConfig {
  key: string
  label: string
  color?: string
  bg?: string
  urgent?: boolean
  onClick?: () => void
}

interface Props {
  title: string
  subtitle: string
  search: string
  onSearchChange: (v: string) => void
  typeFilter?: string
  onTypeChange?: (v: string) => void
  showTypeFilter?: boolean
  stats?: StatConfig[]
  counts?: Record<string, number>
  headerExtra?: React.ReactNode
  children: React.ReactNode
}

// Icône par défaut selon la carte
const STAT_ICONS: Record<string, any> = {
  accounting_review:                cilDollar,
  division_manager_review:          cilUser,
  cap_manager_review:               cilPen,
  deputy_director_secretary_review: cilTask,
  deputy_director_review:           cilTask,
  director_secretary_review:        cilTask,
  director_review:                  cilPen,
  correction:                       cilSend,
}

const DashboardShell = ({
  title, subtitle,
  search, onSearchChange,
  typeFilter, onTypeChange, showTypeFilter = false,
  stats = [], counts = {},
  headerExtra, children,
}: Props) => {
  return (
    <div>
      {stats.length > 0 && (
        <div style={{
          display: 'grid', gap: 14, marginBottom: 28,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))',
        }}>
          {stats.map(s => {
            const palette = STATUS_COLORS[s.key]
            const icon = STAT_ICONS[s.key] ?? cilInbox
            return (
              <StatCard
                key={s.key}
                label={s.label}
                count={counts[s.key] ?? 0}
                color={s.color ?? palette?.color ?? '#475569'}
                bg={s.bg ?? palette?.bg ?? '#f1f5f9'}
                icon={<CIcon icon={icon} style={{ width: 20, height: 20 }} />}
                onClick={s.onClick}
              />
            )
          })}
        </div>
      )}

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
              <div style={{ fontWeight: 800, fontSize: '1.45rem', color: '#0f172a', letterSpacing: '-0.025em' }}>{title}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: 2, fontWeight: 500 }}>{subtitle}</div>
            </div>
            <DemandeSearchBar
              search={search}
              onSearchChange={onSearchChange}
              typeFilter={typeFilter}
              onTypeChange={onTypeChange}
              showTypeFilter={showTypeFilter}
            />
          </div>
          {headerExtra}
        </CCardHeader>

        <CCardBody style={{ padding: 0 }}>{children}</CCardBody>
      </CCard>
    </div>
  )
}

export default DashboardShell
