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
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilPeople,
  cilSchool,
  cilPlus,
  cilNotes,
  cilArrowRight,
  cilFile,
} from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useProfessorGrades from '@/hooks/notes/useProfessorGrades'
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData'
import { useAuth } from '@/contexts'
import HttpService from '@/services/http.service'

const ProfessorDashboard = () => {
  const navigate = useNavigate()
  const { nom, prenoms } = useAuth()
  const fullName =
    prenoms && nom ? `${prenoms} ${nom}` : 'Professeur'

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
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [cohortOptions, setCohortOptions] = useState<Array<{ value: string; label: string }>>([])
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<number | null>(null)

  const yearOptions = useMemo(() =>
    academicYears.map((year: any) => ({ value: year.id, label: year.libelle })),
    [academicYears]
  )

  // Cohortes selon l'année sélectionnée
  useEffect(() => {
    if (!selectedAcademicYear) {
      setCohortOptions([])
      setSelectedCohort(null)
      return
    }
    const fetchCohorts = async () => {
      try {
        const response = await HttpService.get<{ success: boolean; data: any[] }>(
          `inscription/cohortes?academic_year_id=${selectedAcademicYear}`
        )
        if (response.success) {
          setCohortOptions(response.data.map((c: any) => ({ value: c.code, label: c.code })))
        }
      } catch (e) {
        console.error('Erreur cohortes:', e)
      }
    }
    fetchCohorts()
  }, [selectedAcademicYear])

  // Charger les classes selon les filtres
  useEffect(() => {
    const filters: any = {}
    if (selectedAcademicYear) filters.academic_year_id = selectedAcademicYear
    if (selectedCohort) filters.cohort = selectedCohort
    loadMyClasses(Object.keys(filters).length > 0 ? filters : undefined)
  }, [selectedAcademicYear, selectedCohort])

  const handleViewGrades = (programUuid: string) => {
    navigate(`/notes/professor/grade-sheet/${programUuid}`)
  }

  const handleCreateEvaluation = (programUuid: string) => {
    navigate(`/notes/professor/evaluation/${programUuid}`)
  }

  const handleSelectClass = async (classGroupId: number) => {
    setSelectedClassGroupId(classGroupId)
    await loadProgramsByClass(classGroupId)
  }

  if (loading && !classes.length) {
    return <LoadingSpinner fullPage message="Chargement de vos classes..." />
  }

  return (
    <>
      {/* ── En-tête de bienvenue ── */}
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h4 className="fw-bold mb-0">Bonjour, {fullName}</h4>
          <p className="text-muted small mb-0">Gérez les notes de vos classes organisées par cycle et filière</p>
        </CCol>
        <CCol xs="auto" className="d-flex gap-2">
          <CButton
            color="success"
            variant="outline"
            size="sm"
            onClick={() => navigate('/emploi-du-temps/mon-emploi-du-temps')}
          >
            <CIcon icon={cilArrowRight} className="me-1" />
            Mon Emploi du Temps
          </CButton>
          <CButton
            color="warning"
            variant="outline"
            size="sm"
            onClick={() => navigate('/cahier-texte/dashboard')}
          >
            <CIcon icon={cilNotes} className="me-1" />
            Cahier de Texte
          </CButton>
        </CCol>
      </CRow>

      {/* Filtres */}
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <strong>Filtres</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={4}>
              <label className="form-label small fw-semibold">Année Académique</label>
              <Select
                options={yearOptions}
                value={yearOptions.find(opt => opt.value === selectedAcademicYear) || null}
                onChange={(option: any) => setSelectedAcademicYear(option?.value || null)}
                placeholder="Toutes les années..."
                isClearable
                isSearchable
              />
            </CCol>
            <CCol md={4}>
              <label className="form-label small fw-semibold">Cohorte</label>
              <Select
                options={cohortOptions}
                value={cohortOptions.find(opt => opt.value === selectedCohort) || null}
                onChange={(option: any) => setSelectedCohort(option?.value || null)}
                placeholder={selectedAcademicYear ? 'Toutes les cohortes...' : "Sélectionnez d'abord une année..."}
                isClearable
                isSearchable
                isDisabled={!selectedAcademicYear || cohortOptions.length === 0}
              />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {error && (
        <CAlert color="danger" className="mb-4">{error}</CAlert>
      )}

      {/* Classes par cycle */}
      {classes.length > 0 ? (
        <CAccordion activeItemKey={0}>
          {classes.map((cycle: any, cycleIndex: number) => (
            <CAccordionItem key={cycleIndex} itemKey={cycleIndex}>
              <CAccordionHeader>
                <CIcon icon={cilSchool} className="me-2" />
                <strong>{cycle.cycle_name}</strong>
                <CBadge color="info" className="ms-2">
                  {cycle.departments.reduce((t: number, d: any) => t + d.classes.length, 0)} classe(s)
                </CBadge>
              </CAccordionHeader>
              <CAccordionBody>
                {cycle.departments.map((department: any, deptIndex: number) => (
                  <div key={deptIndex} className="mb-4">
                    <h6 className="text-primary mb-3 fw-semibold">
                      <CIcon icon={cilBook} className="me-2" />
                      {department.department_name}
                    </h6>

                    <CRow className="g-3">
                      {department.classes.map((classGroup: any) => {
                        const isSelected = selectedClassGroupId === classGroup.id
                        return (
                          <CCol md={6} lg={4} key={classGroup.id}>
                            <CCard className={`h-100 border-2 ${isSelected ? 'border-primary' : 'border-0 shadow-sm'}`}>
                              <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent">
                                <strong>{classGroup.name}</strong>
                                <CBadge color="secondary">{classGroup.level}</CBadge>
                              </CCardHeader>
                              <CCardBody>
                                <div className="mb-1 small text-muted">
                                  <CIcon icon={cilBook} className="me-1" />
                                  {classGroup.programs_count} programme(s)
                                </div>
                                <div className="mb-3 small text-muted">
                                  <CIcon icon={cilPeople} className="me-1" />
                                  {classGroup.students_count || 0} étudiant(s)
                                </div>
                                <CButton
                                  color="primary"
                                  variant={isSelected ? undefined : 'outline'}
                                  size="sm"
                                  className="w-100"
                                  onClick={() => handleSelectClass(classGroup.id)}
                                >
                                  {isSelected && loading ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    'Voir les programmes'
                                  )}
                                </CButton>
                              </CCardBody>
                            </CCard>
                          </CCol>
                        )
                      })}
                    </CRow>
                  </div>
                ))}
              </CAccordionBody>
            </CAccordionItem>
          ))}
        </CAccordion>
      ) : (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CIcon icon={cilBook} size="3xl" className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">Aucune classe trouvée</h5>
            <p className="text-muted small">
              Vous n'avez pas de classes assignées pour les critères sélectionnés.
            </p>
          </CCardBody>
        </CCard>
      )}

      {/* Programmes de la classe sélectionnée */}
      {programs.length > 0 && (
        <CCard className="mt-4 border-0 shadow-sm">
          <CCardHeader className="bg-transparent">
            <strong>Programmes — {programs[0]?.class_group_name || 'Classe sélectionnée'}</strong>
            <CBadge color="info" className="ms-2">{programs.length} cours</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              {programs.map((program: any) => (
                <CCol md={6} lg={4} key={program.id}>
                  <CCard className="h-100 border-0 bg-light">
                    <CCardHeader className="bg-transparent border-0 pb-0">
                      <strong className="small">{program.course_name}</strong>
                    </CCardHeader>
                    <CCardBody>
                      <p className="text-muted small mb-2">
                        Prof : {program.professor_name || 'Vous'}
                      </p>

                      <div className="mb-3 d-flex gap-1 flex-wrap">
                        <CBadge color={program.column_count > 0 ? 'success' : 'warning'}>
                          {program.column_count} éval.
                        </CBadge>
                        {program.has_retake && (
                          <CBadge color="info">Rattrapage</CBadge>
                        )}
                      </div>

                      <div className="d-grid gap-2">
                        <CButton
                          size="sm"
                          color="primary"
                          onClick={() => handleCreateEvaluation(program.uuid)}
                        >
                          <CIcon icon={cilPlus} className="me-1" />
                          Nouvelle évaluation
                        </CButton>
                        {program.column_count > 0 && (
                          <CButton
                            size="sm"
                            color="info"
                            onClick={() => handleViewGrades(program.uuid)}
                          >
                            <CIcon icon={cilFile} className="me-1" />
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
