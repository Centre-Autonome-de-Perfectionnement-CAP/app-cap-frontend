import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CAlert,
  CRow,
  CCol,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import Swal from 'sweetalert2'
import soutenanceService from '../../../services/soutenance.service'

interface Period {
  id: number
  start_date: string
  end_date: string
  academic_year_id: number
}

interface AcademicYear {
  id: number
  academic_year: string
  defenseSubmissionPeriods: Period[]
}

const SubmissionPeriods: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    loadPeriods()
  }, [])

  const loadPeriods = async () => {
    try {
      setLoading(true)
      const data = await soutenanceService.getPeriods()
      setAcademicYears(data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des périodes')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPeriod = (yearId: number) => {
    setSelectedYear(yearId)
    setFormData({ start_date: '', end_date: '' })
    setShowModal(true)
  }

  const handleEditPeriod = (period: Period) => {
    setSelectedPeriod(period)
    setFormData({
      start_date: period.start_date,
      end_date: period.end_date,
    })
    setEditModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editModal && selectedPeriod) {
        await soutenanceService.updatePeriod(selectedPeriod.id, formData)
        Swal.fire('Succès', 'Période modifiée avec succès', 'success')
      } else if (selectedYear) {
        await soutenanceService.createPeriod(selectedYear, formData)
        Swal.fire('Succès', 'Période ajoutée avec succès', 'success')
      }
      setShowModal(false)
      setEditModal(false)
      loadPeriods()
    } catch (err: any) {
      Swal.fire('Erreur', err.message || 'Une erreur est survenue', 'error')
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  if (loading) return <div>Chargement...</div>

  return (
    <>
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-info text-white">
          <h4 className="mb-0 text-white">Périodes de soumission par année académique</h4>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          {academicYears.map((year) => (
            <CCard key={year.id} className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <span>{year.academic_year}</span>
                <CButton color="info" size="sm" onClick={() => handleAddPeriod(year.id)}>
                  <CIcon icon={cilPlus} /> Ajouter une période
                </CButton>
              </CCardHeader>
              <CCardBody>
                {year.defenseSubmissionPeriods?.length > 0 ? (
                  <CRow className="g-3">
                    {year.defenseSubmissionPeriods.map((period) => {
                      const daysRemaining = getDaysRemaining(period.end_date)
                      return (
                        <CCol key={period.id} md={3}>
                          <CCard
                            className="period-card shadow-sm"
                            style={{ cursor: 'pointer', borderLeft: '4px solid #4e73df' }}
                            onClick={() => handleEditPeriod(period)}
                          >
                            <CCardBody className="text-center">
                              <h6 className="mb-2">
                                {formatDate(period.start_date)}
                                <br />
                                <small>au</small>
                                <br />
                                {formatDate(period.end_date)}
                              </h6>
                              {daysRemaining >= 0 ? (
                                <CBadge color="warning">
                                  {daysRemaining} jour(s) restant(s)
                                </CBadge>
                              ) : (
                                <CBadge color="secondary">
                                  Expiré depuis {Math.abs(daysRemaining)} jour(s)
                                </CBadge>
                              )}
                            </CCardBody>
                          </CCard>
                        </CCol>
                      )
                    })}
                  </CRow>
                ) : (
                  <CAlert color="info" className="mb-0">
                    Aucune période définie pour cette année.
                  </CAlert>
                )}
              </CCardBody>
            </CCard>
          ))}
        </CCardBody>
      </CCard>

      {/* Modal Ajout */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Nouvelle période</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>Date de début</CFormLabel>
              <CFormInput
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Date de fin</CFormLabel>
              <CFormInput
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </CButton>
            <CButton color="info" type="submit">
              Enregistrer
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Modal Édition */}
      <CModal visible={editModal} onClose={() => setEditModal(false)}>
        <CModalHeader>
          <CModalTitle>Modifier la période</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>Date de début</CFormLabel>
              <CFormInput
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Date de fin</CFormLabel>
              <CFormInput
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setEditModal(false)}>
              Annuler
            </CButton>
            <CButton color="info" type="submit">
              Enregistrer
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default SubmissionPeriods
