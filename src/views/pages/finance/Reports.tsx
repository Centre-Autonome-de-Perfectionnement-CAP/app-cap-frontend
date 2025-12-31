import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilChart } from '@coreui/icons'
import financeService from '@/services/finance.service'

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [filters, setFilters] = useState({
    academic_year_id: '',
    department_id: '',
    start_date: '',
    end_date: '',
    group_by: 'month'
  })

  const handleExportPayments = async () => {
    try {
      setLoading(true)
      const response = await financeService.exportPayments(filters)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `paiements_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatsByDepartment = async () => {
    try {
      setLoading(true)
      const response = await financeService.getFinancialStatsByDepartment(
        parseInt(filters.academic_year_id),
        filters.department_id ? parseInt(filters.department_id) : undefined
      )
      setStats(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRevenueByPeriod = async () => {
    try {
      setLoading(true)
      const response = await financeService.getRevenueByPeriod(
        filters.start_date,
        filters.end_date,
        filters.group_by as 'day' | 'month'
      )
      setRevenue(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <strong>Filtres</strong>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="mb-3">
                  <CCol md={3}>
                    <CFormLabel>Année académique</CFormLabel>
                    <CFormSelect
                      value={filters.academic_year_id}
                      onChange={(e) => setFilters({ ...filters, academic_year_id: e.target.value })}
                    >
                      <option value="">Toutes</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Département</CFormLabel>
                    <CFormSelect
                      value={filters.department_id}
                      onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                    >
                      <option value="">Tous</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Date début</CFormLabel>
                    <CFormInput
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Date fin</CFormLabel>
                    <CFormInput
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                  </CCol>
                </CRow>
                <CRow>
                  <CCol>
                    <CButton color="primary" onClick={handleExportPayments} disabled={loading}>
                      <CIcon icon={cilCloudDownload} /> Exporter paiements
                    </CButton>
                    <CButton color="info" className="ms-2" onClick={loadStatsByDepartment} disabled={loading}>
                      <CIcon icon={cilChart} /> Stats par département
                    </CButton>
                    <CButton color="success" className="ms-2" onClick={loadRevenueByPeriod} disabled={loading}>
                      <CIcon icon={cilChart} /> Revenus par période
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {stats.length > 0 && (
        <CRow className="mb-4">
          <CCol xs={12}>
            <CCard>
              <CCardHeader>
                <strong>Statistiques par département</strong>
              </CCardHeader>
              <CCardBody>
                <CTable>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Département</CTableHeaderCell>
                      <CTableHeaderCell>Étudiants</CTableHeaderCell>
                      <CTableHeaderCell>Total collecté</CTableHeaderCell>
                      <CTableHeaderCell>Paiements en attente</CTableHeaderCell>
                      <CTableHeaderCell>Paiements approuvés</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {stats.map((stat: any, index: number) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{stat.name}</CTableDataCell>
                        <CTableDataCell>{stat.total_students}</CTableDataCell>
                        <CTableDataCell>{stat.total_collected?.toLocaleString()} FCFA</CTableDataCell>
                        <CTableDataCell>{stat.pending_payments}</CTableDataCell>
                        <CTableDataCell>{stat.approved_payments}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {revenue.length > 0 && (
        <CRow>
          <CCol xs={12}>
            <CCard>
              <CCardHeader>
                <strong>Revenus par période</strong>
              </CCardHeader>
              <CCardBody>
                <CTable>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Période</CTableHeaderCell>
                      <CTableHeaderCell>Nombre de paiements</CTableHeaderCell>
                      <CTableHeaderCell>Total</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {revenue.map((rev: any, index: number) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{rev.period}</CTableDataCell>
                        <CTableDataCell>{rev.count}</CTableDataCell>
                        <CTableDataCell>{rev.total?.toLocaleString()} FCFA</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {loading && (
        <CRow>
          <CCol className="text-center">
            <CSpinner />
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Reports
