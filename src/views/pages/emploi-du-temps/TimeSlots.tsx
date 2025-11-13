import React, { useState, useMemo } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CRow,
  CCol
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch } from '@coreui/icons'
import { useTimeSlots } from '@/hooks/emploi-du-temps'
import type { CreateTimeSlotRequest, DayOfWeek, TimeSlotType } from '@/types/emploi-du-temps.types'

const TimeSlots = () => {
  const { timeSlots, loading, error, fetchTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } = useTimeSlots()

  const [showModal, setShowModal] = useState(false)
  const [editingTimeSlot, setEditingTimeSlot] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<CreateTimeSlotRequest>({
    day_of_week: 'monday' as DayOfWeek,
    start_time: '',
    end_time: '',
    type: 'lecture' as TimeSlotType,
    name: '',
  })

  // Filter and paginate time slots
  const filteredTimeSlots = useMemo(() => {
    return timeSlots.filter(timeSlot => {
      const matchesSearch = timeSlot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           `${timeSlot.start_time} - ${timeSlot.end_time}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDay = selectedDay === 'all' || timeSlot.day_of_week === selectedDay
      const matchesType = selectedType === 'all' || timeSlot.type === selectedType
      
      return matchesSearch && matchesDay && matchesType
    })
  }, [timeSlots, searchTerm, selectedDay, selectedType])

  const paginatedTimeSlots = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTimeSlots.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTimeSlots, currentPage])

  const totalPages = Math.ceil(filteredTimeSlots.length / itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTimeSlot) {
        await updateTimeSlot(editingTimeSlot.id, formData)
      } else {
        await createTimeSlot(formData)
      }
      resetForm()
      fetchTimeSlots()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      day_of_week: 'monday' as DayOfWeek,
      start_time: '',
      end_time: '',
      type: 'lecture' as TimeSlotType,
      name: '',
    })
    setEditingTimeSlot(null)
    setShowModal(false)
  }

  const handleEdit = (timeSlot: any) => {
    setEditingTimeSlot(timeSlot)
    setFormData({
      day_of_week: timeSlot.day_of_week,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      type: timeSlot.type,
      name: timeSlot.name || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (timeSlot: any) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau horaire ?')) {
      try {
        await deleteTimeSlot(timeSlot.id)
        fetchTimeSlots()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const dayLabels = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  }

  const typeLabels = {
    lecture: 'Cours magistral',
    td: 'TD',
    tp: 'TP',
    exam: 'Examen',
  }

  const typeColors = {
    lecture: 'primary',
    td: 'success',
    tp: 'warning',
    exam: 'danger',
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Créneaux Horaires</h5>
          <CButton 
            color="primary" 
            onClick={() => setShowModal(true)}
          >
            <CIcon icon={cilPlus} className="me-1" />
            Nouveau Créneau
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CRow className="mb-3">
            <CCol md={4}>
              <CInputGroup>
                <CFormInput
                  placeholder="Rechercher un créneau..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton variant="outline" color="secondary">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="all">Tous les jours</option>
                {Object.entries(dayLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {error && <CAlert color="danger">{error}</CAlert>}

          {loading ? (
            <div className="text-center">
              <CSpinner />
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Jour</CTableHeaderCell>
                    <CTableHeaderCell>Heure de début</CTableHeaderCell>
                    <CTableHeaderCell>Heure de fin</CTableHeaderCell>
                    <CTableHeaderCell>Durée</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Nom</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedTimeSlots.map((timeSlot) => (
                    <CTableRow key={timeSlot.id}>
                      <CTableDataCell>
                        {dayLabels[timeSlot.day_of_week as keyof typeof dayLabels]}
                      </CTableDataCell>
                      <CTableDataCell>{timeSlot.start_time}</CTableDataCell>
                      <CTableDataCell>{timeSlot.end_time}</CTableDataCell>
                      <CTableDataCell>
                        {timeSlot.duration_in_hours}h ({timeSlot.duration_in_minutes}min)
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={typeColors[timeSlot.type as keyof typeof typeColors]}>
                          {typeLabels[timeSlot.type as keyof typeof typeLabels]}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {timeSlot.name || '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="info"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(timeSlot)}
                          className="me-1"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(timeSlot)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {totalPages > 1 && (
                <CPagination align="center">
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    Premier
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Précédent
                  </CPaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => Math.abs(page - currentPage) <= 2)
                    .map(page => (
                      <CPaginationItem
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </CPaginationItem>
                    ))}
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivant
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Dernier
                  </CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Modal for creating/editing time slots */}
      <CModal visible={showModal} onClose={resetForm} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingTimeSlot ? 'Modifier le Créneau' : 'Nouveau Créneau'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="day_of_week">Jour de la semaine</CFormLabel>
                  <CFormSelect
                    id="day_of_week"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as DayOfWeek })}
                    required
                  >
                    {Object.entries(dayLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="type">Type</CFormLabel>
                  <CFormSelect
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TimeSlotType })}
                    required
                  >
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="start_time">Heure de début</CFormLabel>
                  <CFormInput
                    type="time"
                    id="start_time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="end_time">Heure de fin</CFormLabel>
                  <CFormInput
                    type="time"
                    id="end_time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </CCol>
            </CRow>
            <div className="mb-3">
              <CFormLabel htmlFor="name">Nom (optionnel)</CFormLabel>
              <CFormInput
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Matin, Après-midi, Soir..."
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={resetForm}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingTimeSlot ? 'Modifier' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default TimeSlots
