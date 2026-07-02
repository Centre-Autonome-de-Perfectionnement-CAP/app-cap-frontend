import React, { useState, useEffect, useCallback } from 'react'
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
  CButtonGroup,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilList, cilGrid, cilReload, cilCalendar } from '@coreui/icons'
import { useAuth } from '@/contexts'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type { ScheduleView } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

const TYPE_COLORS: Record<string, string> = {
  lecture: 'primary',
  td: 'success',
  tp: 'warning',
  exam: 'danger',
}

const ORDERED_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const MonEmploiDuTemps: React.FC = () => {
  const { userId, nom, prenoms } = useAuth()
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleView[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadSchedule = useCallback(async () => {
    if (!userId) {
      setError('Identifiant professeur non trouvé. Veuillez vous reconnecter.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await EmploiDuTempsService.getScheduleByProfessor(userId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      setSchedule(data)
    } catch (err: any) {
      setError(err.message || "Impossible de charger votre emploi du temps")
    } finally {
      setLoading(false)
    }
  }, [userId, startDate, endDate])

  useEffect(() => {
    loadSchedule()
  }, [])

  const handleDownloadPDF = async () => {
    if (!userId) return

    Swal.fire({
      title: 'Génération en cours...',
      html: 'Création du PDF de votre emploi du temps',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      await EmploiDuTempsService.downloadSchedulePDF('professor', userId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      Swal.fire({ icon: 'success', title: 'PDF téléchargé !', timer: 2000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le PDF' })
    }
  }

  // Build grid data from schedule
  const getGridData = () => {
    const timeSlots = new Set<string>()
    schedule.forEach(item => timeSlots.add(`${item.time_slot.start_time}-${item.time_slot.end_time}`))
    const sortedSlots = Array.from(timeSlots).sort()

    const grid: Record<string, Record<string, ScheduleView[]>> = {}
    sortedSlots.forEach(slot => {
      grid[slot] = {}
      ORDERED_DAYS.forEach(day => { grid[slot][day] = [] })
    })
    schedule.forEach(item => {
      const slot = `${item.time_slot.start_time}-${item.time_slot.end_time}`
      const day = item.time_slot.day_of_week
      if (grid[slot]?.[day]) grid[slot][day].push(item)
    })

    return { grid, timeSlots: sortedSlots }
  }

  const renderGrid = () => {
    const { grid, timeSlots } = getGridData()
    if (timeSlots.length === 0) return null

    return (
      <div className="table-responsive">
        <CTable bordered className="schedule-grid mb-0">
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell style={{ width: 110, minWidth: 90 }}>Horaire</CTableHeaderCell>
              {ORDERED_DAYS.map(day => (
                <CTableHeaderCell key={day} className="text-center">
                  {DAY_LABELS[day]}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {timeSlots.map(slot => (
              <CTableRow key={slot}>
                <CTableDataCell className="fw-semibold text-center align-middle small">
                  {slot.replace('-', '\n–\n')}
                </CTableDataCell>
                {ORDERED_DAYS.map(day => (
                  <CTableDataCell key={`${slot}-${day}`} className="p-1 align-top" style={{ minWidth: 130 }}>
                    {grid[slot][day].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2 mb-1 rounded border-start border-4 border-${TYPE_COLORS[item.time_slot.type] || 'secondary'} bg-${TYPE_COLORS[item.time_slot.type] || 'secondary'} bg-opacity-10`}
                      >
                        <div className="fw-semibold small">{item.course_element?.name || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.class_group?.group_name || '—'}
                        </div>
                        {item.room && (
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {item.room.name} · {item.room.building?.name}
                          </div>
                        )}
                        <CBadge color={TYPE_COLORS[item.time_slot.type] || 'secondary'} className="mt-1" style={{ fontSize: '0.65rem' }}>
                          {item.time_slot.type?.toUpperCase()}
                        </CBadge>
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

  const renderList = () => (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Jour</CTableHeaderCell>
          <CTableHeaderCell>Horaire</CTableHeaderCell>
          <CTableHeaderCell>Cours</CTableHeaderCell>
          <CTableHeaderCell>Groupe</CTableHeaderCell>
          <CTableHeaderCell>Salle</CTableHeaderCell>
          <CTableHeaderCell>Type</CTableHeaderCell>
          <CTableHeaderCell>Date début</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {schedule.map((item, idx) => (
          <CTableRow key={idx}>
            <CTableDataCell>{DAY_LABELS[item.time_slot.day_of_week] || item.time_slot.day_of_week}</CTableDataCell>
            <CTableDataCell>
              {item.time_slot.start_time} – {item.time_slot.end_time}
              <br />
              <small className="text-muted">({item.time_slot.duration_in_hours}h)</small>
            </CTableDataCell>
            <CTableDataCell>
              <strong>{item.course_element?.name || '—'}</strong>
              <br />
              <small className="text-muted">{item.course_element?.code}</small>
            </CTableDataCell>
            <CTableDataCell>{item.class_group?.group_name || '—'}</CTableDataCell>
            <CTableDataCell>
              {item.room ? (
                <>
                  {item.room.name}
                  <br />
                  <small className="text-muted">{item.room.building?.name} · {item.room.code}</small>
                </>
              ) : '—'}
            </CTableDataCell>
            <CTableDataCell>
              <CBadge color={TYPE_COLORS[item.time_slot.type] || 'secondary'}>
                {item.time_slot.type?.toUpperCase()}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>
              {new Date(item.start_date).toLocaleDateString('fr-FR')}
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <CIcon icon={cilCalendar} className="me-2 text-success" />
              <strong>Mon Emploi du Temps</strong>
              {(nom || prenoms) && (
                <span className="ms-2 text-muted small">— {prenoms} {nom}</span>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <CButtonGroup>
                <CButton
                  color={viewMode === 'grid' ? 'primary' : 'secondary'}
                  variant={viewMode === 'grid' ? undefined : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <CIcon icon={cilGrid} /> Grille
                </CButton>
                <CButton
                  color={viewMode === 'list' ? 'primary' : 'secondary'}
                  variant={viewMode === 'list' ? undefined : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <CIcon icon={cilList} /> Liste
                </CButton>
              </CButtonGroup>
              <CButton color="success" size="sm" onClick={handleDownloadPDF} disabled={schedule.length === 0}>
                <CIcon icon={cilCloudDownload} className="me-1" />
                PDF
              </CButton>
            </div>
          </CCardHeader>

          <CCardBody>
            {/* Filtres dates */}
            <CRow className="mb-3 g-2 align-items-end">
              <CCol md={3}>
                <label className="form-label small fw-semibold">Date début</label>
                <CFormInput
                  type="date"
                  size="sm"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label small fw-semibold">Date fin</label>
                <CFormInput
                  type="date"
                  size="sm"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </CCol>
              <CCol md={2}>
                <CButton color="primary" size="sm" onClick={loadSchedule} disabled={loading}>
                  <CIcon icon={cilReload} className="me-1" />
                  {loading ? <CSpinner size="sm" /> : 'Actualiser'}
                </CButton>
              </CCol>
            </CRow>

            {error && (
              <CAlert color="danger" className="mb-3">
                {error}
              </CAlert>
            )}

            {loading ? (
              <div className="text-center p-5">
                <CSpinner color="primary" />
                <p className="text-muted mt-2">Chargement de votre emploi du temps...</p>
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <CIcon icon={cilCalendar} size="3xl" className="mb-3 opacity-25" />
                <p>Aucun cours planifié pour cette période.</p>
                <CButton color="primary" variant="outline" size="sm" onClick={loadSchedule}>
                  Recharger
                </CButton>
              </div>
            ) : viewMode === 'grid' ? (
              renderGrid()
            ) : (
              renderList()
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default MonEmploiDuTemps
