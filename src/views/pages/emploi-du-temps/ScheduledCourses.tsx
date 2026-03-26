import { useState, useEffect } from 'react'
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
  CBadge,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CProgress,
} from '@coreui/react'
import { cilPlus, cilPencil, cilTrash, cilX, cilCheckAlt } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'
import type { ScheduledCourse } from '@/types/emploi-du-temps.types'

const ScheduledCourses = () => {
  const {
    scheduledCourses,
    loading,
    meta,
    fetchScheduledCourses,
    cancelCourse,
    deleteCourse,
  } = useScheduledCourses()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadCourses()
  }, [currentPage, search, statusFilter])

  const loadCourses = async () => {
    await fetchScheduledCourses({
      page: currentPage,
      per_page: 15,
      search: search || undefined,
      is_cancelled: statusFilter === 'cancelled' ? true : statusFilter === 'active' ? false : undefined,
    })
  }

  const handleCancel = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce cours ?')) {
      await cancelCourse(id)
      loadCourses()
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours planifié ?')) {
      await deleteCourse(id)
      loadCourses()
    }
  }

  const getStatusBadge = (course: ScheduledCourse) => {
    if (course.is_cancelled) {
      return <CBadge color="danger">Annulé</CBadge>
    }
    if (course.is_completed) {
      return <CBadge color="success">Terminé</CBadge>
    }
    return <CBadge color="info">En cours</CBadge>
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Cours Planifiés</strong>
            <CButton color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-2" />
              Nouveau cours
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="cancelled">Annulés</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Professeur</CTableHeaderCell>
                      <CTableHeaderCell>Groupe</CTableHeaderCell>
                      <CTableHeaderCell>Salle</CTableHeaderCell>
                      <CTableHeaderCell>Créneau</CTableHeaderCell>
                      <CTableHeaderCell>Date début</CTableHeaderCell>
                      <CTableHeaderCell>Progression</CTableHeaderCell>
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
                          <small className="text-muted">
                            {course.course_element?.code || ''}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.professor
                            ? `${course.professor.first_name} ${course.professor.last_name}`
                            : '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.class_group?.group_name || '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.room?.name || '-'}
                          <br />
                          <small className="text-muted">{course.room?.code || ''}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.time_slot
                            ? `${course.time_slot.start_time} - ${course.time_slot.end_time}`
                            : '-'}
                          <br />
                          <small className="text-muted">
                            {course.time_slot?.day_of_week || ''}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>{course.start_date}</CTableDataCell>
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
                            {course.progress_percentage}%
                          </CProgress>
                          <small className="text-muted">
                            {course.hours_completed}h / {course.total_hours}h
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>{getStatusBadge(course)}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            title="Modifier"
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                          {!course.is_cancelled && (
                            <CButton
                              color="warning"
                              size="sm"
                              className="me-2"
                              title="Annuler"
                              onClick={() => handleCancel(course.id)}
                            >
                              <CIcon icon={cilX} />
                            </CButton>
                          )}
                          <CButton
                            color="danger"
                            size="sm"
                            title="Supprimer"
                            onClick={() => handleDelete(course.id)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>

                {meta && meta.last_page > 1 && (
                  <CPagination className="justify-content-center">
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </CPaginationItem>
                    {[...Array(meta.last_page)].map((_, i) => (
                      <CPaginationItem
                        key={i + 1}
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === meta.last_page}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </CPaginationItem>
                  </CPagination>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ScheduledCourses
