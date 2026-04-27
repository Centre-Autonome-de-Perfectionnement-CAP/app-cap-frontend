import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CBadge,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CButtonGroup,
} from '@coreui/react'
import Select from 'react-select'
import { cilCloudDownload, cilList, cilGrid } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import CoursService from '@/services/cours.service'
import RHService from '@/services/rh.service'
import type { ScheduleView } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'
import './ScheduleViews.scss'

const ScheduleViews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'class' | 'professor' | 'room'>('class')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleView[]>([])

  // Filtres
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Options pour les selects
  const [classGroups, setClassGroups] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  // Sélections
  const [selectedClassGroup, setSelectedClassGroup] = useState<number>(0)
  const [selectedProfessor, setSelectedProfessor] = useState<number>(0)
  const [selectedRoom, setSelectedRoom] = useState<number>(0)

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const [classGroupsRes, professorsRes, roomsRes] = await Promise.all([
        CoursService.getClassGroups(),
        RHService.getProfessors({ per_page: 1000 }),
        EmploiDuTempsService.getRooms({ per_page: 1000 }),
      ])

      setClassGroups(classGroupsRes || [])
      setProfessors(professorsRes.data || [])
      setRooms(roomsRes.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données nécessaires',
      })
    }
  }

  const loadSchedule = async () => {
    if (
      (activeTab === 'class' && !selectedClassGroup) ||
      (activeTab === 'professor' && !selectedProfessor) ||
      (activeTab === 'room' && !selectedRoom)
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner un élément',
      })
      return
    }

    setLoading(true)
    try {
      let data: ScheduleView[] = []

      const params = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }

      if (activeTab === 'class') {
        data = await EmploiDuTempsService.getScheduleByClassGroup(selectedClassGroup, params)
      } else if (activeTab === 'professor') {
        data = await EmploiDuTempsService.getScheduleByProfessor(selectedProfessor, params)
      } else if (activeTab === 'room') {
        data = await EmploiDuTempsService.getScheduleByRoom(selectedRoom, params)
      }

      setSchedule(data)
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || "Impossible de charger l'emploi du temps",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDayLabel = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    }
    return days[day] || day
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lecture: 'primary',
      td: 'success',
      tp: 'warning',
      exam: 'danger',
    }
    return colors[type] || 'secondary'
  }

  const handleDownloadPDF = async () => {
    if (
      (activeTab === 'class' && !selectedClassGroup) ||
      (activeTab === 'professor' && !selectedProfessor) ||
      (activeTab === 'room' && !selectedRoom)
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner un élément et charger l\'emploi du temps',
      })
      return
    }

    // Demander le format d'export
    const { value: format } = await Swal.fire({
      title: 'Format d\'export',
      text: 'Choisissez le format de téléchargement',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'PDF',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (!format && format !== false) return

    // Afficher le loader
    Swal.fire({
      title: 'Génération en cours...',
      html: 'Création du fichier PDF',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    try {
      let entityId = 0
      let entityType = ''
      
      if (activeTab === 'class') {
        entityId = selectedClassGroup
        entityType = 'class_group'
      } else if (activeTab === 'professor') {
        entityId = selectedProfessor
        entityType = 'professor'
      } else {
        entityId = selectedRoom
        entityType = 'room'
      }

      await EmploiDuTempsService.downloadSchedulePDF(entityType as 'room' | 'professor' | 'class_group', entityId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })

      Swal.fire({
        icon: 'success',
        title: 'Téléchargement réussi !',
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de télécharger l\'emploi du temps',
      })
    }
  }

  // Préparer les options pour react-select
  const classGroupOptions = classGroups.map((group) => ({
    value: group.id,
    label: group.name,
  }))

  const professorOptions = professors.map((prof) => ({
    value: prof.id,
    label: `${prof.first_name} ${prof.last_name}`,
  }))

  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: `${room.name} (${room.code}) - ${room.building?.name || ''}`,
  }))

  // Organiser les données pour la vue grille
  const getGridData = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const timeSlots = new Set<string>()
    
    // Collecter tous les créneaux horaires uniques
    schedule.forEach((item) => {
      timeSlots.add(`${item.time_slot.start_time}-${item.time_slot.end_time}`)
    })
    
    const sortedTimeSlots = Array.from(timeSlots).sort()
    
    // Créer une grille
    const grid: Record<string, Record<string, ScheduleView[]>> = {}
    
    sortedTimeSlots.forEach((slot) => {
      grid[slot] = {}
      days.forEach((day) => {
        grid[slot][day] = []
      })
    })
    
    // Remplir la grille
    schedule.forEach((item) => {
      const slot = `${item.time_slot.start_time}-${item.time_slot.end_time}`
      const day = item.time_slot.day_of_week
      if (grid[slot] && grid[slot][day]) {
        grid[slot][day].push(item)
      }
    })
    
    return { grid, days, timeSlots: sortedTimeSlots }
  }

  const renderGridView = () => {
    const { grid, days, timeSlots } = getGridData()
    
    return (
      <div className="table-responsive">
        <CTable bordered className="schedule-grid">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell style={{ width: '100px' }}>Horaire</CTableHeaderCell>
              {days.map((day) => (
                <CTableHeaderCell key={day} className="text-center">
                  {getDayLabel(day)}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {timeSlots.map((slot) => (
              <CTableRow key={slot}>
                <CTableDataCell className="fw-bold text-center align-middle">
                  {slot}
                </CTableDataCell>
                {days.map((day) => (
                  <CTableDataCell key={`${slot}-${day}`} className="p-1">
                    {grid[slot][day].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 mb-1 rounded"
                        style={{
                          backgroundColor: `var(--cui-${getTypeColor(item.time_slot.type)})`,
                          color: 'white',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div className="fw-bold">{item.course_element?.name || '-'}</div>
                        {activeTab !== 'professor' && item.professor && (
                          <div className="small">
                            {item.professor.first_name} {item.professor.last_name}
                          </div>
                        )}
                        {activeTab !== 'class' && item.class_group && (
                          <div className="small">{item.class_group.group_name}</div>
                        )}
                        {activeTab !== 'room' && item.room && (
                          <div className="small">
                            {item.room.name} ({item.room.code})
                          </div>
                        )}
                      </div>
                    ))}
                  </CTableDataCell>
                ))}
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </div>
    )
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Consulter les Emplois du Temps</strong>
            <div>
              <CButtonGroup className="me-2">
                <CButton
                  color={viewMode === 'list' ? 'primary' : 'secondary'}
                  variant={viewMode === 'list' ? undefined : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <CIcon icon={cilList} /> Liste
                </CButton>
                <CButton
                  color={viewMode === 'grid' ? 'primary' : 'secondary'}
                  variant={viewMode === 'grid' ? undefined : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <CIcon icon={cilGrid} /> Grille
                </CButton>
              </CButtonGroup>
              <CButton
                color="success"
                onClick={handleDownloadPDF}
                disabled={schedule.length === 0}
              >
                <CIcon icon={cilCloudDownload} className="me-2" />
                Télécharger PDF
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <CNav variant="tabs" role="tablist" className="mb-3">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'class'}
                  onClick={() => setActiveTab('class')}
                  style={{ cursor: 'pointer' }}
                >
                  Par Groupe de Classe
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'professor'}
                  onClick={() => setActiveTab('professor')}
                  style={{ cursor: 'pointer' }}
                >
                  Par Professeur
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'room'}
                  onClick={() => setActiveTab('room')}
                  style={{ cursor: 'pointer' }}
                >
                  Par Salle
                </CNavLink>
              </CNavItem>
            </CNav>

            <CTabContent>
              <CTabPane visible={activeTab === 'class'}>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <Select
                      options={classGroupOptions}
                      value={classGroupOptions.find((opt) => opt.value === selectedClassGroup) || null}
                      onChange={(option) => setSelectedClassGroup(option?.value || 0)}
                      placeholder="Sélectionner un groupe..."
                      isClearable
                      isSearchable
                      noOptionsMessage={() => 'Aucun groupe trouvé'}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date début"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date fin"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CButton color="primary" onClick={loadSchedule} disabled={loading} className="w-100">
                      {loading ? <CSpinner size="sm" /> : 'Afficher'}
                    </CButton>
                  </CCol>
                </CRow>
              </CTabPane>

              <CTabPane visible={activeTab === 'professor'}>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <Select
                      options={professorOptions}
                      value={professorOptions.find((opt) => opt.value === selectedProfessor) || null}
                      onChange={(option) => setSelectedProfessor(option?.value || 0)}
                      placeholder="Sélectionner un professeur..."
                      isClearable
                      isSearchable
                      noOptionsMessage={() => 'Aucun professeur trouvé'}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date début"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date fin"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CButton color="primary" onClick={loadSchedule} disabled={loading} className="w-100">
                      {loading ? <CSpinner size="sm" /> : 'Afficher'}
                    </CButton>
                  </CCol>
                </CRow>
              </CTabPane>

              <CTabPane visible={activeTab === 'room'}>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <Select
                      options={roomOptions}
                      value={roomOptions.find((opt) => opt.value === selectedRoom) || null}
                      onChange={(option) => setSelectedRoom(option?.value || 0)}
                      placeholder="Sélectionner une salle..."
                      isClearable
                      isSearchable
                      noOptionsMessage={() => 'Aucune salle trouvée'}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date début"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="date"
                      placeholder="Date fin"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CButton color="primary" onClick={loadSchedule} disabled={loading} className="w-100">
                      {loading ? <CSpinner size="sm" /> : 'Afficher'}
                    </CButton>
                  </CCol>
                </CRow>
              </CTabPane>
            </CTabContent>

            {loading ? (
              <div className="text-center p-4">
                <CSpinner color="primary" />
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center p-4 text-muted">
                Aucun cours planifié pour cette sélection
              </div>
            ) : viewMode === 'grid' ? (
              renderGridView()
            ) : (
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Jour</CTableHeaderCell>
                    <CTableHeaderCell>Horaire</CTableHeaderCell>
                    <CTableHeaderCell>Cours</CTableHeaderCell>
                    {activeTab !== 'professor' && <CTableHeaderCell>Professeur</CTableHeaderCell>}
                    {activeTab !== 'class' && <CTableHeaderCell>Groupe</CTableHeaderCell>}
                    {activeTab !== 'room' && <CTableHeaderCell>Salle</CTableHeaderCell>}
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Date début</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {schedule.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{getDayLabel(item.time_slot.day_of_week)}</CTableDataCell>
                      <CTableDataCell>
                        {item.time_slot.start_time} - {item.time_slot.end_time}
                        <br />
                        <small className="text-muted">
                          ({item.time_slot.duration_in_hours}h)
                        </small>
                      </CTableDataCell>
                      <CTableDataCell>
                        {item.course_element?.name || '-'}
                        <br />
                        <small className="text-muted">{item.course_element?.code || ''}</small>
                      </CTableDataCell>
                      {activeTab !== 'professor' && (
                        <CTableDataCell>
                          {item.professor
                            ? `${item.professor.first_name} ${item.professor.last_name}`
                            : '-'}
                        </CTableDataCell>
                      )}
                      {activeTab !== 'class' && (
                        <CTableDataCell>{item.class_group?.group_name || '-'}</CTableDataCell>
                      )}
                      {activeTab !== 'room' && (
                        <CTableDataCell>
                          {item.room.name}
                          <br />
                          <small className="text-muted">
                            {item.room.building.name} - {item.room.code}
                          </small>
                        </CTableDataCell>
                      )}
                      <CTableDataCell>
                        <CBadge color={getTypeColor(item.time_slot.type)}>
                          {item.time_slot.type.toUpperCase()}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {new Date(item.start_date).toLocaleDateString('fr-FR')}
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
  )
}

export default ScheduleViews
