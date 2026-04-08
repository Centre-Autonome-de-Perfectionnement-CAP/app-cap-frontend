// src/views/pages/demandes/components/FinancialPanel.tsx
// Situation financière — utilisé uniquement dans ComptableDashboard.

import { useState, useEffect } from 'react'
import { CRow, CCol, CSpinner, CAlert, CBadge, CProgress } from '@coreui/react'
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
    setLoading(true)
    setError('')
    financeService.getStudentBalance(demande.student_pending_student_id)
      .then((res: any) => setFinData(res.data || res))
      .catch(() => setError('Impossible de charger la situation financière.'))
      .finally(() => setLoading(false))
  }, [demande.student_pending_student_id])

  if (loading) return (
    <div className="text-center py-3">
      <CSpinner size="sm" color="primary" className="me-2" />
      <small className="text-muted">Chargement situation financière…</small>
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

  return (
    <div className="border rounded p-3 mt-3" style={{ background: isSolde ? '#f0fdf4' : '#fff7ed' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <p className="fw-semibold small text-muted text-uppercase mb-0">Situation financière</p>
        <CBadge color={isSolde ? 'success' : 'warning'} style={{ fontSize: '0.75rem' }}>
          {isSolde ? '✅ Soldé' : '⚠️ Reste à payer'}
        </CBadge>
      </div>
      <CRow className="g-2 mb-2">
        {[
          { label: 'Total dû', value: totalDue,             cls: '' },
          { label: 'Payé',     value: totalPaid,            cls: 'text-success' },
          { label: 'Restant',  value: Math.abs(balance),    cls: isSolde ? 'text-success' : 'text-danger' },
        ].map(item => (
          <CCol xs={4} key={item.label}>
            <div className="text-center">
              <div className="small text-muted">{item.label}</div>
              <div className={`fw-bold ${item.cls}`} style={{ fontSize: '1.1rem' }}>
                {Number(item.value).toLocaleString('fr-FR')} <span className="small">FCFA</span>
              </div>
            </div>
          </CCol>
        ))}
      </CRow>
      <CProgress value={pct} color={isSolde ? 'success' : pct > 50 ? 'warning' : 'danger'} style={{ height: 6 }} />
      <div className="text-end mt-1"><small className="text-muted">{pct}% réglé</small></div>
    </div>
  )
}

export default FinancialPanel
