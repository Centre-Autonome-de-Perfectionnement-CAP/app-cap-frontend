// src/views/pages/demandes/components/modal/DashboardShell.tsx
// Squelette commun : stat cards + CCard + header + recherche + slot contenu.
// REFONTE StatCards : colonnes adaptatives larges, espacement aéré, libellés non tronqués.

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

/**
 * Calcule la largeur Bootstrap (1-12) de chaque colonne StatCard.
 *
 * Règles :
 *  - 1 stat  → col-12           (pleine largeur, rare)
 *  - 2 stats → col-6            (deux moitiés)
 *  - 3 stats → col-4            (tiers)
 *  - 4 stats → col-6 md col-3   (géré via xs/md séparément)
 *  - 5 stats → col-12 sm-6 xl-  on laisse le grid auto
 *  - ≥6      → col-6 sm-4 lg-2
 *
 * Pour garder le code simple on rend une string de classe Tailwind/Bootstrap
 * directement via les props xs/sm/md/lg/xl de CCol.
 */
const colBreakpoints = (n: number): { xs: number; sm: number; md: number; lg: number } => {
  if (n === 1) return { xs: 12, sm: 12, md: 12,  lg: 12  }
  if (n === 2) return { xs: 12, sm: 6,  md: 6,   lg: 6   }
  if (n === 3) return { xs: 12, sm: 6,  md: 4,   lg: 4   }
  if (n === 4) return { xs: 12, sm: 6,  md: 6,   lg: 3   }
  if (n === 5) return { xs: 12, sm: 6,  md: 4,   lg: 3   }
  // ≥ 6 : 2 colonnes mobile, 3 tablette, 2 par rangée desktop (max 6 par ligne)
  return { xs: 6, sm: 4, md: 3, lg: 2 }
}

const DashboardShell = ({
  title, subtitle,
  search, onSearchChange,
  typeFilter, onTypeChange, showTypeFilter = false,
  stats = [], counts = {},
  headerExtra, children,
}: Props) => {
  const bp = colBreakpoints(stats.length)

  return (
    <div>
      {stats.length > 0 && (
        /* g-4 au lieu de g-3 : gouttières plus larges entre cartes */
        <CRow className="mb-5 g-4">
          {stats.map(s => {
            const palette = STATUS_COLORS[s.key]
            return (
              <CCol key={s.key} xs={bp.xs} sm={bp.sm} md={bp.md} lg={bp.lg}>
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
