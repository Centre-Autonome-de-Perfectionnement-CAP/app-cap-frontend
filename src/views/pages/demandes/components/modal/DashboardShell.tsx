// src/views/pages/demandes/components/modal/DashboardShell.tsx
// Squelette commun : stat cards + CCard + header + recherche + slot contenu.

import { CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
import StatCard from '../ui/StatCard'
import DemandeSearchBar from './DemandeSearchBar'
import { STATUS_COLORS } from '../../constants/workflow'

export interface StatConfig {
  key: string
  label: string
  color?: string
  bg?: string
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

const DashboardShell = ({
  title, subtitle,
  search, onSearchChange,
  typeFilter, onTypeChange, showTypeFilter = false,
  stats = [], counts = {},
  headerExtra, children,
}: Props) => {
  const colSize = stats.length > 0 ? Math.max(3, Math.floor(12 / stats.length)) : 3

  return (
    <div>
      {stats.length > 0 && (
        <CRow className="mb-4 g-3">
          {stats.map(s => {
            const palette = STATUS_COLORS[s.key]
            return (
              <CCol key={s.key} md={colSize} sm={6}>
                <StatCard
                  label={s.label}
                  count={counts[s.key] ?? 0}
                  color={s.color ?? palette?.color ?? '#6b7280'}
                  bg={s.bg ?? palette?.bg ?? '#f9fafb'}
                  text={palette?.text}
                  onClick={s.onClick}
                />
              </CCol>
            )
          })}
        </CRow>
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
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{title}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>
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
