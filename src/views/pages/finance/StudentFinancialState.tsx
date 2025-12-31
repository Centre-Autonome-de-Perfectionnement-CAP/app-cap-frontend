import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner
} from '@coreui/react'
import { financeService } from '@/services/finance.service'

const StudentFinancialState: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const studentPendingStudentId = 1 // À récupérer du contexte utilisateur
      const academicYearId = 1 // À récupérer du contexte
      const response = await financeService.getStudentFinancialState(studentPendingStudentId, academicYearId)
      setData(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <CSpinner />

  return (
    <>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h5>Montant dû</h5>
              <h2>{data?.balance?.total_due?.toLocaleString()} FCFA</h2>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h5>Montant payé</h5>
              <h2 className="text-success">{data?.balance?.total_paid?.toLocaleString()} FCFA</h2>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h5>Solde</h5>
              <h2 className={data?.balance?.balance > 0 ? 'text-danger' : 'text-success'}>
                {data?.balance?.balance?.toLocaleString()} FCFA
              </h2>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <strong>Détails des frais</strong>
            </CCardHeader>
            <CCardBody>
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Libellé</CTableHeaderCell>
                    <CTableHeaderCell>Montant de base</CTableHeaderCell>
                    <CTableHeaderCell>Exonération</CTableHeaderCell>
                    <CTableHeaderCell>Pénalité</CTableHeaderCell>
                    <CTableHeaderCell>Montant final</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data?.balance?.details?.map((detail: any, index: number) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{detail.type}</CTableDataCell>
                      <CTableDataCell>{detail.libelle}</CTableDataCell>
                      <CTableDataCell>{detail.base_amount?.toLocaleString()} FCFA</CTableDataCell>
                      <CTableDataCell>{detail.exoneration?.toLocaleString()} FCFA</CTableDataCell>
                      <CTableDataCell>{detail.penalty?.toLocaleString()} FCFA</CTableDataCell>
                      <CTableDataCell><strong>{detail.final_amount?.toLocaleString()} FCFA</strong></CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mt-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <strong>Historique des paiements</strong>
            </CCardHeader>
            <CCardBody>
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Référence</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Montant</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data?.payments?.map((payment: any) => (
                    <CTableRow key={payment.id}>
                      <CTableDataCell>{payment.reference}</CTableDataCell>
                      <CTableDataCell>{new Date(payment.payment_date).toLocaleDateString()}</CTableDataCell>
                      <CTableDataCell>{payment.amount?.toLocaleString()} FCFA</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={
                          payment.status === 'approved' ? 'success' :
                          payment.status === 'pending' ? 'warning' : 'danger'
                        }>
                          {payment.status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default StudentFinancialState
