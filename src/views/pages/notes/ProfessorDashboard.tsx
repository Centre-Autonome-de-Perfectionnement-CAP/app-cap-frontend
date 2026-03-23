import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CCol,
  CRow,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CBadge,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilPeople,
  cilSchool,
  cilPlus,
  cilCalendar,
} from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useProfessorGrades from '@/hooks/notes/useProfessorGrades'
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData'
import { FRONTEND_ROUTES } from '@/constants'
import { useAuth } from '@/contexts'

const ProfessorDashboard = () => {
  const navigate = useNavigate()
  const { nom, prenoms } = useAuth()
  const fullName = [prenoms, nom].filter(Boolean).join(' ') || 'Professeur'

  const {
    classes,
    programs,
    loading,
    error,
    loadMyClasses,
    loadProgramsByClass,
  } = useProfessorGrades()

  const { academicYears } = useAnneeAcademiquesData()
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null)
  const [selectedCohort, setSelectedCohort]             = useState<string | null>(null)
  const [cohortOptions, setCohortOptions]               = useState<Array<{ value: string; label: string }>>([])

  const yearOptions = useMemo(
    () => academicYears.map((year: any) => ({ value: year.id, label: year.libelle })),
    [academicYears]
  )

  // Charger les cohortes selon l'année sélectionnée
  useEffect(() => {
    const fetchCohorts = async () => {
      if (selectedAcademicYear) {
        try {
          const response = await fetch(
            `http://localhost:8001/api/inscription/cohortes?academic_year_id=${selectedAcademicYear}`
          )
          const data = await response.json()
          if (data.success) setCohortOptions(data.data)
        } catch (error) {
          console.error('Erreur lors du chargement des cohortes:', error)
        }
      } else {
        setCohortOptions([])
        setSelectedCohort(null)
      }
    }
    fetchCohorts()
  }, [selectedAcademicYear])

  // Charger les classes selon les filtres
  useEffect(() => {
    const filters: any = {}
    if (selectedAcademicYear) filters.academic_year_id = selectedAcademicYear
    if (selectedCohort)       filters.cohort           = selectedCohort
    loadMyClasses(Object.keys(filters).length > 0 ? filters : undefined)
  }, [selectedAcademicYear, selectedCohort])

  const handleCreateEvaluation = (programUuid: string) => {
    navigate(`/notes/professor/evaluation/${programUuid}`)
  }

  const handleViewGrades = (programUuid: string) => {
    navigate(`/notes/professor/grade-sheet/${programUuid}`)
  }

  if (loading && !classes.length) {
    return <LoadingSpinner fullPage message="Chargement de vos classes..." />
  }

  return (
    <>
      {/* ── En-tête de bienvenue ── */}
      <CRow className="mb-4 align-items-center">
        <CCol>
          <h2 className="mb-1">Bonjour, {fullName} 👋</h2>
          <p className="text-muted mb-0">
            Gérez vos notes et consultez l'emploi du temps depuis cet espace.
          </p>
        </CCol>
      </CRow>

      {/* ── Raccourcis vers les modules autorisés ── */}
      <CRow className="mb-4 g-3">
        {/* Notes */}
        <CCol xs={12} md={6}>
          <CCard
            className="h-100 border-start border-primary border-3"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(FRONTEND_ROUTES.NOTES.BASE)}
          >
            <CCardBody className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 56, height: 56 }}
              >
                <CIcon icon={cilBook} className="text-primary" size="xl" />
              </div>
              <div>
                <div className="fw-bold fs-5">Module Notes</div>
                <div className="text-muted small">
                  Saisir des évaluations, consulter et gérer les notes
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Emploi du temps */}
        <CCol xs={12} md={6}>
          <CCard
            className="h-100 border-start border-success border-3"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(FRONTEND_ROUTES.EMPLOI_DU_TEMPS.BASE)}
          >
            <CCardBody className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 56, height: 56 }}
              >
                <CIcon icon={cilCalendar} className="text-success" size="xl" />
              </div>
              <div>
                <div className="fw-bold fs-5">Emploi du temps</div>
                <div className="text-muted small">
                  Consulter votre planning et vos créneaux de cours
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── Filtres ── */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Mes classes</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={4}>
              <label className="form-label fw-semibold">Année Académique</label>
              <Select
                options={yearOptions}
                value={yearOptions.find((opt) => opt.value === selectedAcademicYear)}
                onChange={(option: any) => setSelectedAcademicYear(option?.value || null)}
                placeholder="Toutes les années..."
                isClearable
                isSearchable
              />
            </CCol>
            <CCol md={4}>
              <label className="form-label fw-semibold">Cohorte</label>
              <Select
                options={cohortOptions}
                value={cohortOptions.find((opt) => opt.value === selectedCohort)}
                onChange={(option: any) => setSelectedCohort(option?.value || null)}
                placeholder={
                  selectedAcademicYear
                    ? 'Toutes les cohortes...'
                    : "Sélectionnez d'abord une année..."
                }
                isClearable
                isSearchable
                isDisabled={!selectedAcademicYear || cohortOptions.length === 0}
              />
            </CCol>
          </CRow>

          {error && <CAlert color="danger">{error}</CAlert>}

          {/* Liste des classes */}
          {classes.length > 0 ? (
            <CAccordion activeItemKey={0}>
              {classes.map((cycle: any, cycleIndex: number) => (
                <CAccordionItem key={cycleIndex} itemKey={cycleIndex}>
                  <CAccordionHeader>
                    <CIcon icon={cilSchool} className="me-2" />
                    <strong>{cycle.cycle_name}</strong>
                    <CBadge color="info" className="ms-2">
                      {cycle.departments.reduce(
                        (total: number, dept: any) => total + dept.classes.length,
                        0
                      )}{' '}
                      classe(s)
                    </CBadge>
                  </CAccordionHeader>
                  <CAccordionBody>
                    {cycle.departments.map((department: any, deptIndex: number) => (
                      <div key={deptIndex} className="mb-4">
                        <h5 className="text-primary mb-3">
                          <CIcon icon={cilBook} className="me-2" />
                          {department.department_name}
                        </h5>
                        <CRow>
                          {department.classes.map((classGroup: any) => (
                            <CCol md={6} lg={4} key={classGroup.id} className="mb-3">
                              <CCard className="h-100">
                                <CCardHeader className="d-flex justify-content-between align-items-center">
                                  <strong>{classGroup.name}</strong>
                                  <CBadge color="secondary">{classGroup.level}</CBadge>
                                </CCardHeader>
                                <CCardBody>
                                  <div className="mb-2">
                                    <CIcon icon={cilBook} className="me-2" />
                                    <span>{classGroup.programs_count} programme(s)</span>
                                  </div>
                                  <div className="d-flex align-items-center mb-3">
                                    <CIcon icon={cilPeople} className="me-2" />
                                    <span>{classGroup.students_count || 0} étudiant(s)</span>
                                  </div>
                                  <CButton
                                    color="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={() => loadProgramsByClass(classGroup.id)}
                                  >
                                    Voir les programmes
                                  </CButton>
                                </CCardBody>
                              </CCard>
                            </CCol>
                          ))}
                        </CRow>
                      </div>
                    ))}
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          ) : (
            <div className="text-center py-4 text-muted">
              <CIcon icon={cilBook} size="xxl" className="mb-3 opacity-50" />
              <p>Aucune classe trouvée pour les critères sélectionnés.</p>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── Programmes de la classe sélectionnée ── */}
      {programs.length > 0 && (
        <CCard className="mt-4">
          <CCardHeader>
            <strong>Programmes de la classe sélectionnée</strong>
          </CCardHeader>
          <CCardBody>
            <CRow>
              {programs.map((program: any) => (
                <CCol md={6} lg={4} key={program.id} className="mb-3">
                  <CCard>
                    <CCardHeader>
                      <strong>{program.course_name}</strong>
                    </CCardHeader>
                    <CCardBody>
                      <p className="text-muted mb-2">
                        <small>Professeur : {program.professor_name}</small>
                      </p>
                      <div className="mb-3">
                        <CBadge color={program.column_count > 0 ? 'success' : 'warning'}>
                          {program.column_count} évaluation(s)
                        </CBadge>
                        {program.has_retake && (
                          <CBadge color="info" className="ms-2">
                            Rattrapage
                          </CBadge>
                        )}
                      </div>
                      <div className="d-grid gap-2">
                        <CButton
                          color="success"
                          size="sm"
                          onClick={() => program.uuid && handleCreateEvaluation(program.uuid)}
                          disabled={!program.uuid}
                        >
                          <CIcon icon={cilPlus} className="me-1" />
                          Créer évaluation
                        </CButton>
                        {program.column_count > 0 && (
                          <CButton
                            color="primary"
                            size="sm"
                            variant="outline"
                            onClick={() => program.uuid && handleViewGrades(program.uuid)}
                            disabled={!program.uuid}
                          >
                            Voir les notes
                          </CButton>
                        )}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default ProfessorDashboard