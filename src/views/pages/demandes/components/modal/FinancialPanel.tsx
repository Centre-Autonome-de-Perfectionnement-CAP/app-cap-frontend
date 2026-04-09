// src/views/pages/demandes/components/modal/FinancialPanel.tsx

import { useState, useEffect } from 'react'
import { CRow, CCol, CSpinner, CAlert, CProgress } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMoney } from '@coreui/icons'
import { financeService } from '@/services/finance.service'
import type { DocumentRequest } from '@/types/document-request.types'

const FinancialPanel = ({ demande }: { demande: DocumentRequest }) => {
  const [finData,  setFinData]  = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!demande.student_pending_student_id) {
      setLoading(false)
      setError('Identifiant étudiant introuvable.')
      return
    }
    setLoading(true); setError('')
    financeService.getStudentBalance(demande.student_pending_student_id)
      .then((res: any) => setFinData(res.data || res))
      .catch(() => setError('Impossible de charger la situation financière.'))
      .finally(() => setLoading(false))
  }, [demande.student_pending_student_id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <CSpinner size="sm" color="primary" />
      <small style={{ color: '#9ca3af', marginLeft: 8 }}>Chargement situation financière…</small>
    </div>
  )

  if (error) return (
    <CAlert color="warning" className="py-2 small mb-0">
      <CIcon icon={cilMoney} className="me-1" /> {error}
    </CAlert>
  )

  const totalDue  = finData?.total_due  ?? finData?.montant_total ?? 0
  const totalPaid = finData?.total_paid ?? finData?.montant_paye  ?? 0
  const balance   = finData?.balance    ?? finData?.solde         ?? (totalDue - totalPaid)
  const isSolde   = balance <= 0
  const pct       = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0

  const amountStyle = (color: string): React.CSSProperties => ({
    fontWeight: 700, fontSize: '1.05rem', color,
  })

  return (
    <div style={{
      border: `1px solid ${isSolde ? '#bbf7d0' : '#fed7aa'}`,
      borderRadius: 10, padding: '14px 16px', marginTop: 14,
      background: isSolde ? '#f0fdf4' : '#fff7ed',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>
          Situation financière
        </span>
        <span style={{
          fontSize: '0.72rem', padding: '2px 10px', borderRadius: 20, fontWeight: 700,
          background: isSolde ? '#dcfce7' : '#fef3c7',
          color: isSolde ? '#166534' : '#92400e',
        }}>
          {isSolde ? 'Soldé' : 'Reste à payer'}
        </span>
      </div>

      <CRow className="g-2 mb-3">
        {[
          { label: 'Total dû',  value: totalDue,         color: '#374151' },
          { label: 'Payé',      value: totalPaid,        color: '#059669' },
          { label: 'Restant',   value: Math.abs(balance), color: isSolde ? '#059669' : '#dc2626' },
        ].map(item => (
          <CCol xs={4} key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 3 }}>{item.label}</div>
            <div style={amountStyle(item.color)}>
              {Number(item.value).toLocaleString('fr-FR')}
              <span style={{ fontSize: '0.68rem', fontWeight: 500, marginLeft: 3 }}>FCFA</span>
            </div>
          </CCol>
        ))}
      </CRow>

      <CProgress value={pct} color={isSolde ? 'success' : pct > 50 ? 'warning' : 'danger'} style={{ height: 6, borderRadius: 4 }} />
      <div style={{ textAlign: 'right', marginTop: 4 }}>
        <small style={{ color: '#9ca3af', fontSize: '0.72rem' }}>{pct}% réglé</small>
      </div>
    </div>
  )
}

export default FinancialPanel
