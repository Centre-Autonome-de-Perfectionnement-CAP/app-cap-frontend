import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CFormInput,
  CFormSelect,
  CProgress,
  CSpinner,
  CBadge,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { cilPencil } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'
import type { ScheduledCourse } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

const UpdateHours: React.FC = () => {
  const { scheduledCourses, loading, fetchScheduledCourses, updateCompletedHours } =
    useScheduledCourses(undefined, false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<ScheduledCourse | null>(null)
  const [hoursCompleted, setHoursCompleted] = useState<number>(0)

  // Filtres temporaires
  const [tempSearch, setTempSearch] = useState('')
  const [tempStatusFilter, setTempStatusFilter] = useState<string>('')

  const handleFilter = () => {
    setSearch(tempSearch)
    setStatusFilter(tempStatusFilter)
  }

  useEffect(() => {
    loadCourses()
  }, [search, statusFilter])

  const loadCourses = async () => {
    await fetchScheduledCourses({
      per_page: 100,
      search: search || undefined,
      is_cancelled: statusFilter === 'cancelled' ? true : statusFilter === 'active' ? false : undefined,
    })
  }

  const handleOpenModal = (course: ScheduledCourse) => {
    setSelectedCourse(course)
    setHoursCompleted(course.hours_completed)
    setShowModal(true)
  }

  const handleUpdateHours = async () => {
    if (!selectedCourse) return

    if (hoursCompleted < 0 || hoursCompleted > selectedCourse.total_hours) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: `Les heures effectuées doivent être entre 0 et ${selectedCourse.total_hours}`,
      })
      return
    }

    try {
      await updateCompletedHours(selectedCourse.id, hoursCompleted)
      setShowModal(false)
      loadCourses()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getStatusBadge = (course: ScheduledCourse) => {
    if (course.is_cancelled) {
      return <CBadge color="danger">Annulé</CBadge>
    }
    if (course.progress_percentage >= 100) {
      return <CBadge color="success">Terminé</CBadge>
    }
    if (course.progress_percentage >= 50) {
      return <CBadge color="info">En cours</CBadge>
    }
    return <CBadge color="warning">Démarré</CBadge>
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Mise à Jour des Heures Effectuées</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={5}>
                  <CFormInput
                    type="text"
                    placeholder="Rechercher un cours..."
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormSelect value={tempStatusFilter} onChange={(e) => setTempStatusFilter(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="cancelled">Annulés</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CButton color="primary" onClick={handleFilter} className="w-100">
                    <CIcon icon={cilPencil} className="me-1" />
                    Filtrer
                  </CButton>
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                </div>
              ) : scheduledCourses.length === 0 ? (
                <div className="text-center p-4 text-muted">Aucun cours trouvé</div>
              ) : (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Professeur</CTableHeaderCell>
                      <CTableHeaderCell>Groupe</CTableHeaderCell>
                      <CTableHeaderCell>Date début</CTableHeaderCell>
                      <CTableHeaderCell>Progression</CTableHeaderCell>
                      <CTableHeaderCell>Heures</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {scheduledCourses.map((course) => (
                      <CTableRow key={course.id}>
                        <CTableDataCell>
                          {course.course_element?.name || '-'}
                          <br />
                          <small className="text-muted">{course.course_element?.code || ''}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.professor
                            ? `${course.professor.first_name} ${course.professor.last_name}`
                            : '-'}
                        </CTableDataCell>
                        <CTableDataCell>{course.class_group?.group_name || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {new Date(course.start_date).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CProgress
                            value={course.progress_percentage}
                            color={
                              course.progress_percentage >= 100
                                ? 'success'
                                : course.progress_percentage >= 50
                                ? 'info'
                                : 'warning'
                            }
                          >
                            {course.progress_percentage.toFixed(0)}%
                          </CProgress>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{course.hours_completed}h</strong> / {course.total_hours}h
                          <br />
                          <small className="text-muted">
                            Restant: {course.remaining_hours.toFixed(1)}h
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>{getStatusBadge(course)}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="primary"
                            size="sm"
                            onClick={() => handleOpenModal(course)}
                            disabled={course.is_cancelled}
                          >
                            <CIcon icon={cilPencil} className="me-1" />
                            Modifier
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal de mise à jour */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Mettre à Jour les Heures Effectuées</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedCourse && (
            <>
              <div className="mb-3">
                <strong>Cours:</strong> {selectedCourse.course_element?.name}
              </div>
              <div className="mb-3">
                <strong>Groupe:</strong> {selectedCourse.class_group?.group_name}
              </div>
              <div className="mb-3">
                <strong>Masse horaire totale:</strong> {selectedCourse.total_hours}h
              </div>
              <div className="mb-3">
                <strong>Heures actuellement effectuées:</strong> {selectedCourse.hours_completed}h
              </div>
              <div className="mb-3">
                <label htmlFor="hoursCompleted" className="form-label">
                  Nouvelles heures effectuées:
                </label>
                <CFormInput
                  type="number"
                  id="hoursCompleted"
                  value={hoursCompleted}
                  onChange={(e) => setHoursCompleted(parseFloat(e.target.value))}
                  min="0"
                  max={selectedCourse.total_hours}
                  step="0.5"
                />
                <small className="text-muted">
                  Maximum: {selectedCourse.total_hours}h
                </small>
              </div>
              <div className="mb-3">
                <CProgress
                  value={(hoursCompleted / selectedCourse.total_hours) * 100}
                  color={
                    hoursCompleted >= selectedCourse.total_hours
                      ? 'success'
                      : hoursCompleted >= selectedCourse.total_hours / 2
                      ? 'info'
                      : 'warning'
                  }
                >
                  {((hoursCompleted / selectedCourse.total_hours) * 100).toFixed(0)}%
                </CProgress>
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleUpdateHours}>
            Enregistrer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default UpdateHours
