import React, { useState, useRef, useEffect } from 'react'
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
import Select from 'react-select'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'
import { ConflictBadge } from '@/components/emploi-du-temps'
import type { CreateScheduledCourseRequest } from '@/types/emploi-du-temps.types'
import CoursService from '@/services/cours.service'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import Swal from 'sweetalert2'
import './Calendar.scss'
import { end } from '@popperjs/core'

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null)
  const {
    scheduledCourses,
    loading,
    checkConflicts,
    createScheduledCourse,
    updateScheduledCourse,
    cancelCourse,
    fetchScheduledCourses,
  } = useScheduledCourses(undefined, false)

  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  
  // Mode brouillon
  const [draftCourses, setDraftCourses] = useState<(CreateScheduledCourseRequest & { tempId: string })[]>([])
  const [isDraftMode, setIsDraftMode] = useState(true) // Mode brouillon activé par défaut
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
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

  // Options pour les selects
  const [programs, setPrograms] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Traduction des jours en français
  const dayTranslations: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  }

  // Traduction des types de cours
  const typeTranslations: Record<string, string> = {
    lecture: 'Cours magistral',
    td: 'TD',
    tp: 'TP',
    exam: 'Examen',
  }

  // Charger les options au montage du composant
  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      // Charger les programmes (année académique courante)
      const programsResponse = await CoursService.getPrograms({
        // academic_year_id sera ajouté quand disponible
        per_page: 1000,
      })
      setPrograms(programsResponse.data || [])

      // Charger les créneaux horaires
      const timeSlotsResponse = await EmploiDuTempsService.getTimeSlots({
        per_page: 1000,
      })
      setTimeSlots(timeSlotsResponse.data || [])

      // Charger les salles
      const roomsResponse = await EmploiDuTempsService.getRooms({
        is_available: true,
        per_page: 1000,
      })
      setRooms(roomsResponse.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données nécessaires',
      })
    } finally {
      setLoadingOptions(false)
    }
  }

  // Préparer les options pour react-select
  const programOptions = programs.map((program) => ({
    value: program.id,
    label: `${program.course_element_professor?.course_element?.name || 'N/A'} - ${program.course_element_professor?.professor?.first_name || ''} ${program.course_element_professor?.professor?.last_name || ''} - ${program.class_group?.department?.name || 'N/A'} ${program.class_group?.study_level || ''} (${program.class_group?.group_name || ''})`,
  }))

  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: `${room.name} (${room.code}) - Capacité: ${room.capacity}`,
  }))

  // Fonction pour obtenir la couleur selon le type de cours
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

  // Convertir les cours planifiés en événements FullCalendar
  console.log('Draft courses:', draftCourses)
  console.log('All time slots:', timeSlots)
  
  const allEvents = [
    // Cours validés
    ...scheduledCourses.map((course) => {
      const startDate = new Date(course.start_date)
      const timeSlot = course.time_slot
      
      if (!timeSlot) {
        return {
          id: course.id.toString(),
          title: `${course.course_element?.name || 'Cours'} - ${course.class_group?.group_name || ''}`,
          start: startDate,
          end: startDate,
          backgroundColor: '#6c757d',
          borderColor: '#6c757d',
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
            isDraft: false,
          },
        }
      }
      
      // Construire la date/heure de début
      const [startHour, startMinute] = timeSlot.start_time.split(':')
      startDate.setHours(parseInt(startHour), parseInt(startMinute))
      
      // Construire la date/heure de fin
      const endDate = new Date(startDate)
      const [endHour, endMinute] = timeSlot.end_time.split(':')
      endDate.setHours(parseInt(endHour), parseInt(endMinute))

      return {
        id: course.id.toString(),
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
          isDraft: false,
        },
      }
    }),
    // Cours en brouillon
    ...draftCourses.map((draft) => {
      const program = programs.find((p) => p.id === draft.program_id)
      const timeSlot = timeSlots.find((ts) => ts.id === draft.time_slot_id)
      const room = rooms.find((r) => r.id === draft.room_id)

      // Debug: afficher les informations du brouillon
      console.log('Draft course:', {
        tempId: draft.tempId,
        start_date: draft.start_date,
        time_slot_id: draft.time_slot_id,
        timeSlot: timeSlot,
        program: program?.course_element_professor?.course_element?.name
      })

      // Créer une date valide
      const startDate = new Date(draft.start_date + 'T00:00:00')
      
      if (timeSlot) {
        const [startHour, startMinute] = timeSlot.start_time.split(':')
        startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
        
        const endDate = new Date(startDate)
        const [endHour, endMinute] = timeSlot.end_time.split(':')
        endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

        console.log('Draft event created:', {
          id: `draft-${draft.tempId}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          title: `🔸 BROUILLON - ${program?.course_element_professor?.course_element?.name || 'Cours'}`
        })

        return {
          id: `draft-${draft.tempId}`,
          title: `🔸 BROUILLON - ${program?.course_element_professor?.course_element?.name || 'Cours'}`,
          start: startDate,
          end: endDate,
          backgroundColor: getColorForCourse(timeSlot.type),
          borderColor: '#ffc107',
          textColor: '#ffffff',
          classNames: ['draft-event'],
          resource: {
            tempId: draft.tempId,
            roomName: room?.name || '',
            roomCode: room?.code || '',
            professorName: program?.course_element_professor?.professor
              ? `${program.course_element_professor.professor.first_name} ${program.course_element_professor.professor.last_name}`
              : '',
            classGroupName: program?.class_group?.group_name || '',
            courseElementName: program?.course_element_professor?.course_element?.name || '',
            isDraft: true,
          },
        }
      }

      return {
        id: `draft-${draft.tempId}`,
        title: `🔸 BROUILLON - ${program?.course_element_professor?.course_element?.name || 'Cours'}`,
        start: startDate,
        end: startDate,
        backgroundColor: '#ffc107',
        borderColor: '#ffc107',
        textColor: '#ffffff',
        classNames: ['draft-event'],
        resource: {
          tempId: draft.tempId,
          isDraft: true,
        },
      }
    }),
  ]

  // Fonctions pour gérer le brouillon
  const addToDraft = async () => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const newDraft = {
      ...formData,
      tempId,
    }
    
    // Demander si le cours se répète dans la semaine
    const result = await Swal.fire({
      title: 'Cours ajouté au brouillon',
      html: `
        <div class="text-start">
          <p>✓ <strong>${programs.find(p => p.id === formData.program_id)?.course_element_professor?.course_element?.name || 'Cours'}</strong></p>
          <p class="text-muted">${new Date(formData.start_date).toLocaleDateString('fr-FR')} - ${timeSlots.find(ts => ts.id === formData.time_slot_id)?.start_time || ''}</p>
          <hr>
          <p class="mt-3"><strong>Ce cours se répète-t-il dans la semaine ?</strong></p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Oui, ajouter d\'autres jours',
      denyButtonText: 'Non, c\'est unique',
      confirmButtonColor: '#0d6efd',
      denyButtonColor: '#6c757d',
    })

    if (result.isDenied) {
      // Cours unique
      setDraftCourses([...draftCourses, newDraft])
      setShowModal(false)
      resetForm()
      
      Swal.fire({
        icon: 'success',
        title: 'Ajouté !',
        text: `Total: ${draftCourses.length + 1} cours en brouillon`,
        timer: 2000,
        showConfirmButton: false,
      })
    } else if (result.isConfirmed) {
      // Cours répété - ouvrir le sélecteur de jours
      await showMultiDaySelector(newDraft)
    }
  }

  const showMultiDaySelector = async (baseDraft: any) => {
    const days = [
      { value: 'monday', label: 'Lundi' },
      { value: 'tuesday', label: 'Mardi' },
      { value: 'wednesday', label: 'Mercredi' },
      { value: 'thursday', label: 'Jeudi' },
      { value: 'friday', label: 'Vendredi' },
      { value: 'saturday', label: 'Samedi' },
    ]

    const baseDate = new Date(baseDraft.start_date)
    const baseDayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][baseDate.getDay()]

    // Créer les options de créneaux pour chaque jour
    const timeSlotsByDay: Record<string, any[]> = {}
    days.forEach(day => {
      timeSlotsByDay[day.value] = timeSlots.filter(ts => ts.day_of_week === day.value)
    })

    const { value: formValues } = await Swal.fire({
      title: 'Ajouter d\'autres occurrences',
      html: `
        <div class="text-start" style="max-height: 400px; overflow-y: auto;">
          <p class="mb-3">Sélectionnez les jours et leurs créneaux horaires :</p>
          ${days.map(day => `
            <div class="card mb-2 ${day.value === baseDayOfWeek ? 'border-primary' : ''}">
              <div class="card-body p-2">
                <div class="form-check">
                  <input 
                    class="form-check-input day-checkbox" 
                    type="checkbox" 
                    value="${day.value}" 
                    id="day-${day.value}"
                    ${day.value === baseDayOfWeek ? 'checked disabled' : ''}
                    onchange="document.getElementById('timeslot-${day.value}').disabled = !this.checked"
                  >
                  <label class="form-check-label fw-bold" for="day-${day.value}">
                    ${day.label} ${day.value === baseDayOfWeek ? '(original)' : ''}
                  </label>
                </div>
                <select 
                  class="form-select form-select-sm mt-2" 
                  id="timeslot-${day.value}"
                  ${day.value === baseDayOfWeek ? '' : 'disabled'}
                >
                  <option value="">Sélectionner un créneau...</option>
                  ${timeSlotsByDay[day.value].map(ts => `
                    <option value="${ts.id}" ${day.value === baseDayOfWeek && ts.id === baseDraft.time_slot_id ? 'selected' : ''}>
                      ${ts.start_time} - ${ts.end_time} (${ts.type})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>
          `).join('')}
          <p class="text-muted mt-3 small">💡 Vous pouvez choisir des créneaux différents pour chaque jour</p>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Ajouter au brouillon',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const selected: Array<{ day: string; timeSlotId: number }> = []
        days.forEach(day => {
          const checkbox = document.getElementById(`day-${day.value}`) as HTMLInputElement
          const timeSlotSelect = document.getElementById(`timeslot-${day.value}`) as HTMLSelectElement
          
          if (checkbox && checkbox.checked && timeSlotSelect && timeSlotSelect.value) {
            selected.push({
              day: day.value,
              timeSlotId: parseInt(timeSlotSelect.value)
            })
          }
        })
        
        if (selected.length === 0) {
          Swal.showValidationMessage('Veuillez sélectionner au moins un jour avec un créneau')
        }
        
        return selected
      }
    })

    if (formValues && formValues.length > 0) {
      const newDrafts = formValues.map((item: { day: string; timeSlotId: number }) => {
        // Calculer la prochaine date pour ce jour
        const nextDate = getNextDateForDay(item.day, baseDate)
        return {
          ...baseDraft,
          tempId: `temp-${Date.now()}-${Math.random()}`,
          start_date: nextDate.toISOString().split('T')[0],
          time_slot_id: item.timeSlotId,
        }
      })

      setDraftCourses([...draftCourses, ...newDrafts])
      setShowModal(false)
      resetForm()

      Swal.fire({
        icon: 'success',
        title: 'Ajoutés !',
        html: `<strong>${newDrafts.length} cours</strong> ajoutés au brouillon<br>Total: ${draftCourses.length + newDrafts.length}`,
        timer: 2500,
        showConfirmButton: false,
      })
    }
  }

  // Fonction utilitaire pour obtenir la date d'un jour spécifique dans la semaine courante
  const getNextDateForDay = (targetDay: string, fromDate: Date): Date => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDayIndex = days.indexOf(targetDay)
    
    // Obtenir le lundi de la semaine courante
    const currentDate = new Date(fromDate)
    const currentDayIndex = currentDate.getDay()
    const daysFromMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1 // Dimanche = 6 jours après lundi
    const monday = new Date(currentDate)
    monday.setDate(currentDate.getDate() - daysFromMonday)
    
    // Calculer le jour cible dans la semaine courante
    const targetDate = new Date(monday)
    const daysFromMondayToTarget = targetDayIndex === 0 ? 6 : targetDayIndex - 1
    targetDate.setDate(monday.getDate() + daysFromMondayToTarget)
    
    return targetDate
  }

  const removeDraft = (tempId: string) => {
    setDraftCourses(draftCourses.filter((d) => d.tempId !== tempId))
  }

  const clearAllDrafts = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Annuler tous les brouillons ?',
      text: `${draftCourses.length} cours seront supprimés`,
      showCancelButton: true,
      confirmButtonText: 'Oui, tout annuler',
      cancelButtonText: 'Non',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setDraftCourses([])
      Swal.fire('Annulé !', 'Tous les brouillons ont été supprimés', 'success')
    }
  }

  const validateAllDrafts = async () => {
    if (draftCourses.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucun brouillon',
        text: 'Ajoutez des cours avant de valider',
      })
      return
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Valider l\'emploi du temps ?',
      html: `Vous allez créer <strong>${draftCourses.length} cours</strong>.<br/>Cette action est irréversible.`,
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#0d6efd',
    })

    if (!result.isConfirmed) return

    // Afficher le loader
    Swal.fire({
      title: 'Création en cours...',
      html: `Création de <strong>${draftCourses.length} cours</strong>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    setSubmitting(true)
    try {
      const response = await EmploiDuTempsService.bulkCreateScheduledCourses(
        draftCourses.map(({ tempId, ...course }) => course)
      )

      // Si tous les cours ont été créés avec succès
      if (response.summary.created_count === draftCourses.length) {
        setDraftCourses([])
        await fetchScheduledCourses()
        
        Swal.fire({
          icon: 'success',
          title: 'Emploi du temps validé !',
          html: `<strong>${response.summary.created_count}</strong> cours créés avec succès`,
          timer: 3000,
        })
        return
      }

      // Si aucun cours n'a été créé (tous en conflit)
      if (response.summary.created_count === 0 && response.summary.conflict_count > 0) {
        const conflictDetails = response.conflicts?.map((conflict: any, idx: number) => {
          const draft = draftCourses[conflict.index]
          const program = programs.find(p => p.id === draft.program_id)
          const timeSlot = timeSlots.find(ts => ts.id === draft.time_slot_id)
          const room = rooms.find(r => r.id === draft.room_id)
          
          return `
            <div class="alert alert-warning text-start mb-2">
              <strong>Cours ${idx + 1}:</strong> ${program?.course_element_professor?.course_element?.name || 'N/A'}<br/>
              <small>${new Date(draft.start_date).toLocaleDateString('fr-FR')} - ${timeSlot?.start_time || ''} - ${room?.name || ''}</small><br/>
              <small class="text-danger">⚠️ ${conflict.conflicts?.length || 0} conflit(s) détecté(s)</small>
            </div>
          `
        }).join('') || ''

        Swal.fire({
          icon: 'error',
          title: 'Conflits détectés',
          html: `
            <div class="text-start">
              <p class="mb-3">Aucun cours n'a pu être créé à cause de conflits :</p>
              <div style="max-height: 300px; overflow-y: auto;">
                ${conflictDetails}
              </div>
              <hr>
              <p class="text-muted small mt-3">💡 Modifiez les créneaux, salles ou dates pour éviter les conflits</p>
            </div>
          `,
          width: '600px',
        })
        return
      }

      // Si création partielle (certains créés, d'autres en conflit)
      if (response.summary.conflict_count > 0 || response.summary.error_count > 0) {
        // Supprimer les cours créés du brouillon
        const createdIndices = response.created?.map((c: any) => c.index) || []
        const remainingDrafts = draftCourses.filter((_, idx) => !createdIndices.includes(idx))
        setDraftCourses(remainingDrafts)
        await fetchScheduledCourses()
        
        Swal.fire({
          icon: 'warning',
          title: 'Validation partielle',
          html: `
            <div class="text-start">
              <p>✅ Créés: <strong>${response.summary.created_count}</strong></p>
              <p>⚠️ Conflits: <strong>${response.summary.conflict_count}</strong></p>
              <p>❌ Erreurs: <strong>${response.summary.error_count}</strong></p>
              <hr>
              <p class="text-muted small">Les cours en conflit restent en brouillon</p>
            </div>
          `,
        })
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || 'Impossible de valider l\'emploi du temps',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr)
    setSelectedEvent(null)
    resetForm()
    setShowModal(true)
  }

  // Filtrer les créneaux horaires selon le jour de la date sélectionnée
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return timeSlots

    const date = new Date(selectedDate)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[date.getDay()]

    return timeSlots.filter((slot) => slot.day_of_week === dayOfWeek)
  }

  const filteredTimeSlots = getFilteredTimeSlots()

  const timeSlotOptions = filteredTimeSlots.map((slot) => ({
    value: slot.id,
    label: `${dayTranslations[slot.day_of_week] || slot.day_of_week} ${slot.start_time}-${slot.end_time} (${typeTranslations[slot.type] || slot.type})`,
  }))

  const handleEventClick = (info: any) => {
    const event = info.event
    const resource = event.extendedProps.resource

    // Si c'est un brouillon
    if (resource.isDraft) {
      Swal.fire({
        title: '🔸 Cours en brouillon',
        html: `
          <div class="text-start">
            <p><strong>Cours:</strong> ${resource.courseElementName}</p>
            <p><strong>Salle:</strong> ${resource.roomName} (${resource.roomCode})</p>
            <p><strong>Professeur:</strong> ${resource.professorName}</p>
            <p><strong>Groupe:</strong> ${resource.classGroupName}</p>
            <p><strong>Début:</strong> ${event.start?.toLocaleString('fr-FR')}</p>
            <p><strong>Fin:</strong> ${event.end?.toLocaleString('fr-FR')}</p>
            <p class="text-warning mt-2">⚠️ Ce cours n'est pas encore validé</p>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Fermer',
        denyButtonText: 'Supprimer du brouillon',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#6c757d',
        denyButtonColor: '#dc3545',
      }).then((result) => {
        if (result.isDenied) {
          removeDraft(resource.tempId)
          Swal.fire('Supprimé !', 'Le cours a été retiré du brouillon', 'success')
        }
      })
      return
    }

    // Cours validé
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
      showDenyButton: !resource.is_cancelled && !resource.isDraft,
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
    setSubmitting(true)

    try {
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

      if (selectedEvent) {
        await updateScheduledCourse(selectedEvent.id, formData)
      } else {
        await createScheduledCourse(formData, true) // skip conflict check car déjà fait
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setSubmitting(false)
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
              {/* Barre d'actions mode brouillon */}
              {draftCourses.length > 0 && (
                <CAlert color="warning" className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong>🔸 Mode Brouillon:</strong> {draftCourses.length} cours en attente de validation
                  </div>
                  <div>
                    <CButton
                      color="success"
                      size="sm"
                      className="me-2"
                      onClick={validateAllDrafts}
                      disabled={submitting}
                    >
                      {submitting ? <CSpinner size="sm" className="me-1" /> : '✓ '}
                      Valider l'emploi du temps
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      variant="outline"
                      onClick={clearAllDrafts}
                      disabled={submitting}
                    >
                      ✕ Tout annuler
                    </CButton>
                  </div>
                </CAlert>
              )}
              
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
                  events={allEvents}
                  editable={false}  // Désactiver le drag & drop pour respecter les créneaux
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  slotMinTime="07:00:00"
                  slotMaxTime="23:00:00"
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
              <Select
                id="program_id"
                options={programOptions}
                value={programOptions.find((opt) => opt.value === formData.program_id) || null}
                onChange={(option) =>
                  setFormData({ ...formData, program_id: option?.value || 0 })
                }
                placeholder="Sélectionner un programme..."
                isClearable
                isSearchable
                isLoading={loadingOptions}
                noOptionsMessage={() => 'Aucun programme trouvé'}
              />
              <small className="text-muted">
                Le programme lie un cours, un professeur et un groupe de classe
              </small>
            </div>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="time_slot_id">Créneau horaire *</CFormLabel>
                  <Select
                    id="time_slot_id"
                    options={timeSlotOptions}
                    value={timeSlotOptions.find((opt) => opt.value === formData.time_slot_id) || null}
                    onChange={(option) =>
                      setFormData({ ...formData, time_slot_id: option?.value || 0 })
                    }
                    placeholder="Sélectionner un créneau..."
                    isClearable
                    isSearchable
                    isLoading={loadingOptions}
                    noOptionsMessage={() => 'Aucun créneau trouvé'}
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="room_id">Salle *</CFormLabel>
                  <Select
                    id="room_id"
                    options={roomOptions}
                    value={roomOptions.find((opt) => opt.value === formData.room_id) || null}
                    onChange={(option) =>
                      setFormData({ ...formData, room_id: option?.value || 0 })
                    }
                    placeholder="Sélectionner une salle..."
                    isClearable
                    isSearchable
                    isLoading={loadingOptions}
                    noOptionsMessage={() => 'Aucune salle trouvée'}
                  />
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
            <CButton color="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Annuler
            </CButton>
            {isDraftMode && !selectedEvent && (
              <CButton
                color="warning"
                onClick={addToDraft}
                disabled={loading || checkingConflicts || submitting || !formData.program_id || !formData.time_slot_id || !formData.room_id}
              >
                🔸 Ajouter au brouillon
              </CButton>
            )}
            <CButton color="primary" type="submit" disabled={loading || checkingConflicts || submitting}>
              {submitting ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  {selectedEvent ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                selectedEvent ? 'Mettre à jour' : 'Créer'
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Calendar
