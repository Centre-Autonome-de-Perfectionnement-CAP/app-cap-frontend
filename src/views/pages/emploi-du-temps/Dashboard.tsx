import React, { useMemo } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsF,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBuilding,
  cilRoom,
  cilClock,
  cilCalendar,
  cilCheckCircle,
  cilXCircle,
} from '@coreui/icons'
import { useDashboard } from '@/hooks/emploi-du-temps'
import { useScheduledCourses } from '@/hooks/emploi-du-temps'

const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboard()
  
  // Mémoriser les filtres pour éviter la recréation à chaque render
  const filters = useMemo(() => ({ per_page: 5 }), [])
  
  const { scheduledCourses, loading: coursesLoading } = useScheduledCourses(filters, true)

  // Filtrer les cours à venir (non annulés, date >= aujourd'hui)
  const upcomingCourses = scheduledCourses
    .filter((course) => !course.is_cancelled && new Date(course.start_date) >= new Date())
    .slice(0, 5)

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Tableau de bord - Emploi du Temps</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis">
                Bienvenue sur le module de gestion des emplois du temps
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {statsLoading ? (
        <div className="text-center p-4">
          <CSpinner color="primary" />
        </div>
      ) : (
        <>
          <CRow>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="primary"
                icon={<CIcon icon={cilBuilding} height={24} />}
                title="Bâtiments"
                value={stats.total_buildings.toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="info"
                icon={<CIcon icon={cilRoom} height={24} />}
                title="Salles"
                value={stats.total_rooms.toString()}
                footer={`${stats.available_rooms} disponibles`}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="warning"
                icon={<CIcon icon={cilClock} height={24} />}
                title="Créneaux horaires"
                value={stats.total_time_slots.toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="success"
                icon={<CIcon icon={cilCalendar} height={24} />}
                title="Cours planifiés"
                value={stats.total_scheduled_courses.toString()}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="success"
                icon={<CIcon icon={cilCheckCircle} height={24} />}
                title="Cours actifs"
                value={stats.active_courses.toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="danger"
                icon={<CIcon icon={cilXCircle} height={24} />}
                title="Cours annulés"
                value={stats.cancelled_courses.toString()}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="info"
                icon={<CIcon icon={cilRoom} height={24} />}
                title="Taux d'occupation salles"
                value={`${stats.rooms_utilization_rate}%`}
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                color="warning"
                icon={<CIcon icon={cilClock} height={24} />}
                title="Conflits détectés"
                value={stats.conflicts_detected.toString()}
              />
            </CCol>
          </CRow>
        </>
      )}

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Activités récentes</strong>
            </CCardHeader>
            <CCardBody>
              {coursesLoading ? (
                <div className="text-center p-3">
                  <CSpinner size="sm" />
                </div>
              ) : scheduledCourses.length === 0 ? (
                <p className="text-medium-emphasis">Aucune activité récente</p>
              ) : (
                <CTable small hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Groupe</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {scheduledCourses.slice(0, 5).map((course) => (
                      <CTableRow key={course.id}>
                        <CTableDataCell>
                          <small>{course.course_element?.name || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{course.class_group?.group_name || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{new Date(course.start_date).toLocaleDateString('fr-FR')}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          {course.is_cancelled ? (
                            <CBadge color="danger" size="sm">
                              Annulé
                            </CBadge>
                          ) : (
                            <CBadge color="success" size="sm">
                              Actif
                            </CBadge>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Cours à venir</strong>
            </CCardHeader>
            <CCardBody>
              {coursesLoading ? (
                <div className="text-center p-3">
                  <CSpinner size="sm" />
                </div>
              ) : upcomingCourses.length === 0 ? (
                <p className="text-medium-emphasis">Aucun cours à venir</p>
              ) : (
                <CTable small hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Cours</CTableHeaderCell>
                      <CTableHeaderCell>Professeur</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Salle</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {upcomingCourses.map((course) => (
                      <CTableRow key={course.id}>
                        <CTableDataCell>
                          <small>{course.course_element?.name || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>
                            {course.professor
                              ? `${course.professor.first_name} ${course.professor.last_name}`
                              : '-'}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{new Date(course.start_date).toLocaleDateString('fr-FR')}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{course.room?.name || '-'}</small>
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
    </>
  )
}

export default Dashboard
