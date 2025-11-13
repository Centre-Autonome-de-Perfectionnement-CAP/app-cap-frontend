import React, { useState, useRef, useCallback } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CFormTextarea,
  CFormCheck,
  CAlert,
  CRow,
  CCol,
  CSpinner,
  CBadge,
} from '@coreui/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'
import { ConflictBadge, ProgressBar } from '@/components/emploi-du-temps'
import type { CalendarEvent, CreateScheduledCourseRequest } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'
import './Calendar.scss'

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null)
  const {
    scheduledCourses,
    loading,
    checkConflicts,
    createScheduledCourse,
    updateScheduledCourse,
    cancelCourse,
    deleteCourse,
  } = useScheduledCourses()

  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [formData, setFormData] = useState<CreateScheduledCourseRequest>({
    program_id: 0,
    time_slot_id: 0,
    room_id: 0,
    start_date: '',
    total_hours: 0,
    is_recurring: false,
    notes: '',
  })
  const [conflicts, setConflicts] = useState<any[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  // Convertir les cours planifiés en événements FullCalendar
  const events: CalendarEvent[] = scheduledCourses.map((course) => {
    const startDate = new Date(course.start_date)
    const timeSlot = course.time_slot
    
    // Construire la date/heure de début
    const [startHour, startMinute] = timeSlot.start_time.split(':')
    startDate.setHours(parseInt(startHour), parseInt(startMinute))
    
    // Construire la date/heure de fin
    const endDate = new Date(startDate)
    const [endHour, endMinute] = timeSlot.end_time.split(':')
    endDate.setHours(parseInt(endHour), parseInt(endMinute))

    return {
      id: course.id,
      title: `${course.course_element?.name || 'Cours'} - ${course.class_group?.group_name || ''}`,
      start: startDate,
      end: endDate,
      backgroundColor: course.is_cancelled ? '#6c757d' : getColorForCourse(course.time_slot?.type),
      borderColor: course.is_cancelled ? '#6c757d' : getColorForCourse(course.time_slot?.type),
      textColor: '#ffffff',
      resource: {
        scheduledCourseId: course.id,
        roomName: course.room?.name || '',
        roomCode: course.room?.code || '',
        professorName: course.professor
          ? `${course.professor.first_name} ${course.professor.last_name}`
          : '',
        classGroupName: course.class_group?.group_name || '',
        courseElementName: course.course_element?.name || '',
        is_cancelled: course.is_cancelled,
        progress_percentage: course.progress_percentage,
      },
    }
  })

  const getColorForCourse = (type?: string) => {
    switch (type) {
      case 'lecture':
        return '#0d6efd' // Bleu
      case 'td':
        return '#198754' // Vert
      case 'tp':
        return '#ffc107' // Jaune
      case 'exam':
        return '#dc3545' // Rouge
      default:
        return '#6c757d' // Gris
    }
  }

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr)
    setSelectedEvent(null)
    resetForm()
    setShowModal(true)
  }

  const handleEventClick = (info: any) => {
    const event = info.event
    const resource = event.extendedProps.resource

    Swal.fire({
      title: event.title,
      html: `
        <div class="text-start">
          <p><strong>Salle:</strong> ${resource.roomName} (${resource.roomCode})</p>
          <p><strong>Professeur:</strong> ${resource.professorName}</p>
          <p><strong>Groupe:</strong> ${resource.classGroupName}</p>
          <p><strong>Début:</strong> ${event.start.toLocaleString('fr-FR')}</p>
          <p><strong>Fin:</strong> ${event.end.toLocaleString('fr-FR')}</p>
          ${resource.is_cancelled ? '<p><strong class="text-danger">⚠️ ANNULÉ</strong></p>' : ''}
          ${resource.progress_percentage > 0 ? `<p><strong>Progression:</strong> ${resource.progress_percentage}%</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      showDenyButton: !resource.is_cancelled,
      confirmButtonText: 'Modifier',
      denyButtonText: 'Annuler le cours',
      cancelButtonText: 'Fermer',
      confirmButtonColor: '#0d6efd',
      denyButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Modifier le cours
        setSelectedEvent(event)
        setShowModal(true)
      } else if (result.isDenied) {
        // Annuler le cours
        await cancelCourse(resource.scheduledCourseId)
      }
    })
  }

  const handleCheckConflicts = async () => {
    if (!formData.program_id || !formData.time_slot_id || !formData.room_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez remplir tous les champs obligatoires avant de vérifier les conflits',
      })
      return
    }

    setCheckingConflicts(true)
    try {
      const result = await checkConflicts({
        program_id: formData.program_id,
        time_slot_id: formData.time_slot_id,
        room_id: formData.room_id,
        start_date: formData.start_date,
        is_recurring: formData.is_recurring,
        recurrence_end_date: formData.recurrence_end_date,
      })

      if (result) {
        setConflicts(result.conflicts || [])
        if (!result.has_conflicts) {
          Swal.fire({
            icon: 'success',
            title: 'Aucun conflit',
            text: 'Aucun conflit détecté ! Vous pouvez créer ce cours.',
            timer: 2000,
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des conflits:', error)
    } finally {
      setCheckingConflicts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier les conflits avant de créer
    const result = await checkConflicts({
      program_id: formData.program_id,
      time_slot_id: formData.time_slot_id,
      room_id: formData.room_id,
      start_date: formData.start_date,
      is_recurring: formData.is_recurring,
      recurrence_end_date: formData.recurrence_end_date,
    })

    if (result?.has_conflicts) {
      const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Conflits détectés',
        text: 'Des conflits ont été détectés. Voulez-vous quand même créer ce cours ?',
        showCancelButton: true,
        confirmButtonText: 'Oui, créer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33',
      })

      if (!confirm.isConfirmed) {
        return
      }
    }

    try {
      if (selectedEvent) {
        await updateScheduledCourse(selectedEvent.id, formData)
      } else {
        await createScheduledCourse(formData, true) // skip conflict check car déjà fait
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      program_id: 0,
      time_slot_id: 0,
      room_id: 0,
      start_date: selectedDate || '',
      total_hours: 0,
      is_recurring: false,
      notes: '',
    })
    setConflicts([])
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Calendrier des Cours</strong>
              <div>
                <CBadge color="primary" className="me-2">
                  <span className="badge-legend" style={{ backgroundColor: '#0d6efd' }}></span>
                  Cours Magistral
                </CBadge>
                <CBadge color="success" className="me-2">
                  <span className="badge-legend" style={{ backgroundColor: '#198754' }}></span>
                  TD
                </CBadge>
                <CBadge color="warning" className="me-2">
                  <span className="badge-legend" style={{ backgroundColor: '#ffc107' }}></span>
                  TP
                </CBadge>
                <CBadge color="danger">
                  <span className="badge-legend" style={{ backgroundColor: '#dc3545' }}></span>
                  Examen
                </CBadge>
              </div>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  locale={frLocale}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  events={events}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  slotMinTime="07:00:00"
                  slotMaxTime="20:00:00"
                  height="auto"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false,
                  }}
                />
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal Formulaire */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {selectedEvent ? 'Modifier le Cours' : 'Nouveau Cours Planifié'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            {conflicts.length > 0 && (
              <CAlert color="warning" className="mb-3">
                <strong>⚠️ Conflits détectés :</strong>
                <ConflictBadge conflicts={conflicts} />
              </CAlert>
            )}

            <div className="mb-3">
              <CFormLabel htmlFor="program_id">Programme (Cours + Professeur + Groupe) *</CFormLabel>
              <CFormSelect
                id="program_id"
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: parseInt(e.target.value) })}
                required
              >
                <option value={0}>Sélectionner un programme...</option>
                {/* TODO: Charger les programmes depuis l'API */}
              </CFormSelect>
              <small className="text-muted">
                Le programme lie un cours, un professeur et un groupe de classe
              </small>
            </div>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="time_slot_id">Créneau horaire *</CFormLabel>
                  <CFormSelect
                    id="time_slot_id"
                    value={formData.time_slot_id}
                    onChange={(e) =>
                      setFormData({ ...formData, time_slot_id: parseInt(e.target.value) })
                    }
                    required
                  >
                    <option value={0}>Sélectionner un créneau...</option>
                    {/* TODO: Charger les créneaux depuis l'API */}
                  </CFormSelect>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="room_id">Salle *</CFormLabel>
                  <CFormSelect
                    id="room_id"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value={0}>Sélectionner une salle...</option>
                    {/* TODO: Charger les salles depuis l'API */}
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="start_date">Date de début *</CFormLabel>
                  <CFormInput
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="total_hours">Masse horaire (heures) *</CFormLabel>
                  <CFormInput
                    type="number"
                    id="total_hours"
                    value={formData.total_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, total_hours: parseFloat(e.target.value) })
                    }
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
              </CCol>
            </CRow>

            <div className="mb-3">
              <CFormCheck
                id="is_recurring"
                label="Cours récurrent (hebdomadaire)"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              />
            </div>

            {formData.is_recurring && (
              <div className="mb-3">
                <CFormLabel htmlFor="recurrence_end_date">Date de fin de récurrence</CFormLabel>
                <CFormInput
                  type="date"
                  id="recurrence_end_date"
                  value={formData.recurrence_end_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence_end_date: e.target.value })
                  }
                />
                <small className="text-muted">
                  Laissez vide pour calculer automatiquement selon la masse horaire
                </small>
              </div>
            )}

            <div className="mb-3">
              <CFormLabel htmlFor="notes">Notes</CFormLabel>
              <CFormTextarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <CButton
                color="warning"
                variant="outline"
                onClick={handleCheckConflicts}
                disabled={checkingConflicts}
                className="w-100"
              >
                {checkingConflicts ? <CSpinner size="sm" /> : '🔍 Vérifier les conflits'}
              </CButton>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit" disabled={loading || checkingConflicts}>
              {loading ? <CSpinner size="sm" /> : selectedEvent ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Calendar
