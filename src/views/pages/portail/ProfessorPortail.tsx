import { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CRow,
  CSpinner,
  CBadge,
  CButton,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
  cilClipboard,
  cilCalendar,
  cilNotes,
  cilBook,
  cilPeople,
  cilChevronRight,
} from '@coreui/icons'
import { useAuth } from '@/contexts'
import notesService from '@/services/notes.service'
import CahierService from '@/services/cahier.service'

const modules = [
  {
    title: 'Mes Notes & Évaluations',
    description: 'Gérer les notes de vos classes, créer des évaluations et consulter les fiches de notation.',
    icon: cilClipboard,
    color: 'primary',
    url: '/notes/professor/dashboard',
    actions: [
      { label: 'Mes classes', url: '/notes/professor/dashboard' },
    ],
  },
  {
    title: 'Mon Emploi du Temps',
    description: 'Consulter votre planning de cours hebdomadaire et les informations sur vos séances.',
    icon: cilCalendar,
    color: 'success',
    url: '/emploi-du-temps/mon-emploi-du-temps',
    actions: [
      { label: 'Voir mon planning', url: '/emploi-du-temps/mon-emploi-du-temps' },
    ],
  },
  {
    title: 'Cahier de Texte',
    description: 'Enregistrer le contenu de vos séances, les devoirs assignés et le suivi pédagogique.',
    icon: cilNotes,
    color: 'warning',
    url: '/cahier-texte/mes-entrees',
    actions: [
      { label: 'Mes entrées', url: '/cahier-texte/mes-entrees' },
      { label: 'Nouvelle entrée', url: '/cahier-texte/new' },
    ],
  },
]

interface QuickStats {
  totalClasses: number
  totalEvaluations: number
  totalEntries: number
  draftEntries: number
}

const ProfessorPortail = () => {
  const { nom, prenoms, userId } = useAuth()
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setLoadingStats(true)
      const [classesRes, cahierStats] = await Promise.allSettled([
        notesService.getMyClasses(),
        userId ? CahierService.getStatistics({ professor_id: userId }) : Promise.resolve(null),
      ])

      const classes = classesRes.status === 'fulfilled' ? classesRes.value?.data || [] : []
      const totalClasses = classes.reduce((sum: number, cycle: any) =>
        sum + cycle.departments.reduce((d: number, dept: any) => d + dept.classes.length, 0), 0)

      const cahier = cahierStats.status === 'fulfilled' ? cahierStats.value : null

      setStats({
        totalClasses,
        totalEvaluations: 0,
        totalEntries: cahier?.total_entries || 0,
        draftEntries: cahier?.draft_entries || 0,
      })
    } catch {
      setStats({ totalClasses: 0, totalEvaluations: 0, totalEntries: 0, draftEntries: 0 })
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 py-5">
      <CContainer>
        {/* Header */}
        <div className="mb-5">
          <h2 className="fw-bold">
            Bonjour, {prenoms} {nom}
          </h2>
          <p className="text-muted fs-5">Portail Professeur — Centre Autonome de Perfectionnement</p>
        </div>

        {/* Quick Stats */}
        {loadingStats ? (
          <div className="text-center mb-4">
            <CSpinner color="primary" size="sm" />
          </div>
        ) : stats && (
          <CRow className="mb-5 g-3">
            <CCol xs={6} md={3}>
              <CCard className="border-0 shadow-sm text-center h-100">
                <CCardBody>
                  <div className="mb-1">
                    <CIcon icon={cilPeople} size="xl" className="text-primary" />
                  </div>
                  <h3 className="fw-bold text-primary mb-0">{stats.totalClasses}</h3>
                  <small className="text-muted">Mes classes</small>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={6} md={3}>
              <CCard className="border-0 shadow-sm text-center h-100">
                <CCardBody>
                  <div className="mb-1">
                    <CIcon icon={cilBook} size="xl" className="text-success" />
                  </div>
                  <h3 className="fw-bold text-success mb-0">{stats.totalEntries}</h3>
                  <small className="text-muted">Entrées cahier</small>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={6} md={3}>
              <CCard className="border-0 shadow-sm text-center h-100">
                <CCardBody>
                  <div className="mb-1">
                    <CIcon icon={cilNotes} size="xl" className="text-warning" />
                  </div>
                  <h3 className="fw-bold text-warning mb-0">{stats.draftEntries}</h3>
                  <small className="text-muted">Brouillons</small>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={6} md={3}>
              <CCard className="border-0 shadow-sm text-center h-100">
                <CCardBody>
                  <div className="mb-1">
                    <CIcon icon={cilCalendar} size="xl" className="text-info" />
                  </div>
                  <h3 className="fw-bold text-info mb-0">—</h3>
                  <small className="text-muted">Cours à venir</small>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}

        {/* Modules */}
        <h4 className="mb-3 text-muted fw-semibold">Mes Modules</h4>
        <CRow className="g-4">
          {modules.map((mod, idx) => (
            <CCol md={4} key={idx}>
              <CCard className="h-100 border-0 shadow-sm hover-shadow">
                <CCardBody className="d-flex flex-column p-4">
                  <div className={`mb-3 rounded-circle bg-${mod.color} bg-opacity-10 d-inline-flex align-items-center justify-content-center`}
                    style={{ width: 56, height: 56 }}>
                    <CIcon icon={mod.icon} size="xl" className={`text-${mod.color}`} />
                  </div>
                  <h5 className="fw-bold mb-2">{mod.title}</h5>
                  <p className="text-muted small mb-4 flex-grow-1">{mod.description}</p>
                  <div className="d-flex flex-wrap gap-2">
                    {mod.actions.map((action, aIdx) => (
                      <Link key={aIdx} to={action.url} style={{ textDecoration: 'none' }}>
                        <CButton color={mod.color} variant={aIdx === 0 ? undefined : 'outline'} size="sm">
                          {action.label}
                          {aIdx === 0 && <CIcon icon={cilChevronRight} className="ms-1" />}
                        </CButton>
                      </Link>
                    ))}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CContainer>
    </div>
  )
}

export default ProfessorPortail
