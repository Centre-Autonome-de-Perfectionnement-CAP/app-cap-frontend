// src/views/pages/demandes/components/DashboardShell.tsx
// Squelette commun : stats cards + CCard + header + recherche + slot contenu.

import { CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
import DemandeSearchBar from './DemandeSearchBar'

export interface StatConfig {
  key: string
  label: string
  color: string
  bg: string
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

// ─── Carte de statistique ─────────────────────────────────────────────────────

const StatCard = ({ label, count, color, bg, onClick }: {
  label: string; count: number; color: string; bg: string; onClick?: () => void
}) => (
  <div
    onClick={onClick}
    style={{
      background: bg,
      border: `1px solid ${color}22`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 10,
      padding: '14px 18px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
    onMouseEnter={e => {
      if (!onClick) return
      const t = e.currentTarget as HTMLDivElement
      t.style.transform = 'translateY(-2px)'
      t.style.boxShadow = `0 4px 16px ${color}33`
    }}
    onMouseLeave={e => {
      if (!onClick) return
      const t = e.currentTarget as HTMLDivElement
      t.style.transform = 'none'
      t.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
    }}
  >
    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>
      {count}
    </div>
  </div>
)

// ─── Shell principal ──────────────────────────────────────────────────────────

const DashboardShell = ({
  title, subtitle,
  search, onSearchChange,
  typeFilter, onTypeChange, showTypeFilter = false,
  stats = [], counts = {},
  headerExtra, children,
}: Props) => (
  <div>
    {/* Stats */}
    {stats.length > 0 && (
      <CRow className="mb-4 g-3">
        {stats.map(s => (
          <CCol key={s.key} md={Math.max(3, Math.floor(12 / stats.length))} sm={6}>
            <StatCard
              label={s.label}
              count={counts[s.key] ?? 0}
              color={s.color}
              bg={s.bg}
              onClick={s.onClick}
            />
          </CCol>
        ))}
      </CRow>
    )}

    {/* Card principale */}
    <CCard className="border-0" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderRadius: 12 }}>
      <CCardHeader
        className="bg-white"
        style={{
          borderBottom: '1px solid #f1f5f9',
          borderRadius: '12px 12px 0 0',
          padding: '16px 20px 12px',
        }}
      >
        {/* Titre + recherche */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
          <div>
            <div className="fw-bold" style={{ fontSize: '1.05rem', color: '#111827' }}>{title}</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{subtitle}</div>
          </div>
          <DemandeSearchBar
            search={search}
            onSearchChange={onSearchChange}
            typeFilter={typeFilter}
            onTypeChange={onTypeChange}
            showTypeFilter={showTypeFilter}
          />
        </div>

        {/* Slot extra (onglets, filtres supplémentaires…) */}
        {headerExtra}
      </CCardHeader>

      <CCardBody className="p-0">{children}</CCardBody>
    </CCard>
  </div>
)

export default DashboardShell
