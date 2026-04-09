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
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { cilPlus, cilPencil, cilTrash, cilX, cilCheckAlt } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'
import type { ScheduledCourse } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

const ScheduledCourses = () => {
  const {
    scheduledCourses,
    loading,
    meta,
    fetchScheduledCourses,
    cancelCourse,
    deleteCourse,
    updateCompletedHours,
  } = useScheduledCourses(undefined, false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<ScheduledCourse | null>(null)
  const [hoursCompleted, setHoursCompleted] = useState<number>(0)

  // Filtres temporaires
  const [tempSearch, setTempSearch] = useState('')
  const [tempStatusFilter, setTempStatusFilter] = useState<string>('')

  const handleFilter = () => {
    setSearch(tempSearch)
    setStatusFilter(tempStatusFilter)
    setCurrentPage(1)
  }

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
    const result = await Swal.fire({
      title: 'Annuler ce cours ?',
      html: 'Cette action marquera le cours comme annulé.<br/>Les heures ne seront plus comptabilisées.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, garder',
    })

    if (result.isConfirmed) {
      await cancelCourse(id)
      loadCourses()
      Swal.fire('Annulé !', 'Le cours a été annulé avec succès.', 'success')
    }
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Supprimer ce cours ?',
      html: 'Cette action est irréversible.<br/>Toutes les données liées seront perdues.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    })

    if (result.isConfirmed) {
      await deleteCourse(id)
      loadCourses()
      Swal.fire('Supprimé !', 'Le cours a été supprimé avec succès.', 'success')
    }
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
      Swal.fire('Mis à jour !', 'Les heures ont été mises à jour avec succès.', 'success')
    } catch (error) {
      console.error('Erreur:', error)
      Swal.fire('Erreur', 'Une erreur est survenue lors de la mise à jour.', 'error')
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
              <CCol md={5}>
                <CFormInput
                  type="text"
                  placeholder="Rechercher..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={tempStatusFilter}
                  onChange={(e) => setTempStatusFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="cancelled">Annulés</option>
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CButton color="primary" onClick={handleFilter} className="w-100">
                  <CIcon icon={cilCheckAlt} className="me-1" />
                  Filtrer
                </CButton>
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
                    {scheduledCourses.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                          Aucun cours planifié trouvé
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      scheduledCourses.map((course) => (
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
                              title="Mettre à jour les heures"
                              onClick={() => handleOpenModal(course)}
                              disabled={course.is_cancelled}
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
                      ))
                    )}
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

      {/* Modal de mise à jour des heures */}
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
    </CRow>
  )
}

export default ScheduledCourses
