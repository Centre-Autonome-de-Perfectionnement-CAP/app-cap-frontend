// src/views/pages/demandes/components/layout/DirectionStatBar.tsx
// Barre de statistiques pour SecDA et SecDir.
// Props reçues depuis l'endpoint /api/document-requests/stats

import { CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSync, cilClock, cilCheckCircle, cilXCircle } from '@coreui/icons'

interface DirectionStats {
  total_in_progress: number
  pending_at_my_level: number
  total_validated: number
  total_rejected: number
}

interface Props {
  stats: DirectionStats | null
  loading?: boolean
}

const DEFS = [
  {
    key: 'total_in_progress' as const,
    label: 'En cours dans le circuit',
    icon: cilSync,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'pending_at_my_level' as const,
    label: 'En attente de votre action',
    icon: cilClock,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
  },
  {
    key: 'total_validated' as const,
    label: 'Total transmis',
    icon: cilCheckCircle,
    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    key: 'total_rejected' as const,
    label: 'Total rejetés',
    icon: cilXCircle,
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
  },
]

const DirectionStatBar = ({ stats, loading = false }: Props) => (
  <CRow className="mb-4 g-3">
    {DEFS.map(def => (
      <CCol key={def.key} md={3} sm={6}>
        <div style={{
          background: def.bg,
          border: `1px solid ${def.border}`,
          borderLeft: `4px solid ${def.color}`,
          borderRadius: 10,
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          minHeight: 88,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.72rem', color: def.color, fontWeight: 600,
            opacity: 0.85, marginBottom: 6,
          }}>
            <CIcon icon={def.icon} style={{ width: 14, flexShrink: 0 }} />
            {def.label}
          </div>
          <div style={{
            fontSize: '2rem', fontWeight: 800, color: def.color, lineHeight: 1,
          }}>
            {loading ? '—' : (stats?.[def.key] ?? 0)}
          </div>
        </div>
      </CCol>
    ))}
  </CRow>
)

export default DirectionStatBar
