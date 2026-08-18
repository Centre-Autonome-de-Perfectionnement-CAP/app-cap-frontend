import { CCard, CCardBody, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilClock, cilCheckCircle, cilXCircle } from '@coreui/icons'
import type { LegacyStudentStats } from '@/types/legacyStudent.types'

interface StatCardProps {
  value: number | string
  label: string
  icon: any
  color: string
  isActive?: boolean
  onClick?: () => void
}

const StatCard = ({ value, label, icon, color, isActive, onClick }: StatCardProps) => (
  <CCol xs={12} sm={6} lg={3}>
    <CCard 
      className={`shadow-sm h-100 ${isActive ? `border border-2 border-${color}` : 'border-0'}`}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }}
      onClick={onClick}
    >
      <CCardBody className="d-flex align-items-center justify-content-between">
        <div>
          <div className="fs-2 fw-bold">{value}</div>
          <div className="text-muted small">{label}</div>
        </div>
        <div 
          className={`rounded-circle bg-${color} bg-opacity-10 d-inline-flex align-items-center justify-content-center`} 
          style={{ width: 48, height: 48 }}
        >
          <CIcon icon={icon} size="xl" className={`text-${color}`} />
        </div>
      </CCardBody>
    </CCard>
  </CCol>
)

interface LegacyStudentsStatsProps {
  stats: LegacyStudentStats
  loading: boolean
  activeStatus?: string
  onStatClick?: (status: string) => void
}

const LegacyStudentsStats = ({ stats, loading, activeStatus, onStatClick }: LegacyStudentsStatsProps) => {
  if (loading && !stats.total) {
    return (
      <div className="d-flex justify-content-center align-items-center mb-4" style={{ minHeight: '100px' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CRow className="mb-4 g-4">
      <StatCard 
        value={stats.total} label="Total déclarations" icon={cilPeople} color="primary" 
        isActive={activeStatus === '' || activeStatus === 'all'} 
        onClick={() => onStatClick?.('all')} 
      />
      <StatCard 
        value={stats.pending} label="À valider" icon={cilClock} color="warning" 
        isActive={activeStatus === 'pending'} 
        onClick={() => onStatClick?.('pending')} 
      />
      <StatCard 
        value={stats.validated} label="Dossiers validés" icon={cilCheckCircle} color="success" 
        isActive={activeStatus === 'validated'} 
        onClick={() => onStatClick?.('validated')} 
      />
      <StatCard 
        value={stats.rejected} label="Dossiers rejetés" icon={cilXCircle} color="danger" 
        isActive={activeStatus === 'rejected'} 
        onClick={() => onStatClick?.('rejected')} 
      />
    </CRow>
  )
}

export default LegacyStudentsStats
