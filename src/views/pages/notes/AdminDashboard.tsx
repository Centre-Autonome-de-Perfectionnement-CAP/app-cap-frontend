import { useState, useEffect, useMemo } from 'react'
import Select from 'react-select'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CAlert,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilChart, 
  cilPeople, 
  cilBook, 
  cilCheckCircle,
  cilCloudDownload,
  cilFilter
} from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import { StatsCard } from '@/components/dashboard'
import useAdminGrades from '@/hooks/notes/useAdminGrades'
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData'

const AdminDashboard = () => {
  const {
    dashboardStats,
    gradesByFilters,
    programDetails,
    loading,
    error,
    loadDashboard,
    loadGradesByFilters,
    loadProgramDetails,
    exportByDepartment
  } = useAdminGrades()

  const { academicYears } = useAnneeAcademiquesData()
  const [departments, setDepartments] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])

  // États pour les filtres
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null)
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null)

  // Charger les filières et niveaux
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const inscriptionService = (await import('@/services/inscription.service')).default
        const [deptData, levelData] = await Promise.all([
          inscriptionService.getFilieres(),
          inscriptionService.getAllNiveaux()
        ])
        setDepartments(deptData || [])
        setLevels(levelData || [])
      } catch (err) {
        console.error('Erreur chargement filtres:', err)
      }
    }
    loadFilters()
  }, [])

  // Charger les cohortes quand l'année change
  useEffect(() => {
    if (!selectedAcademicYear) return
    const loadCohorts = async () => {
      try {
        const inscriptionService = (await import('@/services/inscription.service')).default
        const cohortData = await inscriptionService.getCohorts(selectedAcademicYear)
        setCohorts(cohortData || [])
      } catch (err) {
        console.error('Erreur chargement cohortes:', err)
      }
    }
    loadCohorts()
  }, [selectedAcademicYear])

  // Options pour les sélecteurs
  const yearOptions = useMemo(() => {
    return academicYears.map((year: any) => ({
      value: year.id,
      label: year.libelle
    }))
  }, [academicYears])

  const cohortOptions = useMemo(() => {
    return cohorts.map((cohort: any) => {
      const cohortValue = typeof cohort === 'string' ? cohort : (cohort.cohort || cohort.value || cohort)
      return {
        value: cohortValue,
        label: cohortValue
      }
    })
  }, [cohorts])

  const departmentOptions = useMemo(() => {
    return departments.map((dept: any) => ({
      value: dept.id,
      label: dept.title
    }))
  }, [departments])

  const levelOptions = useMemo(() => {
    return levels.map((level: any) => ({
      value: level.value,
      label: level.label
    }))
  }, [levels])

  const programOptions = useMemo(() => {
    return [
      { value: null, label: 'Tous les programmes (Vue d\'ensemble)' },
      ...(gradesByFilters || []).map((p: any) => ({
        value: p.program_id,
        label: `${p.program_name} (${p.class_name})`
      }))
    ]
  }, [gradesByFilters])

  // Charger l'année académique courante par défaut
  useEffect(() => {
    const currentYear = academicYears.find((year: any) => year.is_current)
    if (currentYear) {
      setSelectedAcademicYear(currentYear.id)
    }
  }, [academicYears])

  useEffect(() => {
    if (selectedAcademicYear) {
      loadDashboard(selectedAcademicYear)
    }
  }, [selectedAcademicYear])

  // Charger les données filtrées
  useEffect(() => {
    if (!selectedAcademicYear) return
    
    const filters: any = { academic_year_id: selectedAcademicYear }
    if (selectedCohort) filters.cohort = selectedCohort
    if (selectedDepartment) filters.department_id = selectedDepartment
    if (selectedLevel) filters.level = selectedLevel
    if (selectedProgram) filters.program_id = selectedProgram
    
    loadGradesByFilters(filters)
  }, [selectedAcademicYear, selectedCohort, selectedDepartment, selectedLevel, selectedProgram])

  // Charger le détail du programme sélectionné
  useEffect(() => {
    if (selectedProgram) {
      loadProgramDetails(selectedProgram)
    }
  }, [selectedProgram])

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!selectedAcademicYear) {
      alert('Veuillez sélectionner une année académique')
      return
    }

    const params: any = { academic_year_id: selectedAcademicYear, format }
    if (selectedDepartment) params.department_id = selectedDepartment
    if (selectedLevel) params.level = selectedLevel

    const result = await exportByDepartment(params)

    if (result.success) {
      console.log('Export réussi:', result.data)
    }
  }

  if (loading && !dashboardStats && (!gradesByFilters || gradesByFilters.length === 0)) {
    return <LoadingSpinner fullPage message="Chargement du dashboard..." />
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol>
          <h2>Dashboard des Notes</h2>
          <p className="text-muted">
            Vue d'ensemble des évaluations et des résultats par filière et par programme
          </p>
        </CCol>
      </CRow>

      {/* Statistiques */}
      {gradesByFilters && gradesByFilters.length > 0 && (() => {
        const totalPrograms = gradesByFilters.length
        const totalStudents = gradesByFilters.reduce((sum: number, p: any) => sum + (p.total_students || 0), 0)
        const studentsWithGrades = gradesByFilters.reduce((sum: number, p: any) => sum + (p.students_with_grades || 0), 0)
        const evaluatedPrograms = gradesByFilters.filter((p: any) => p.average_class != null && !isNaN(Number(p.average_class)))
        const globalAverage = evaluatedPrograms.length > 0
          ? (evaluatedPrograms.reduce((sum: number, p: any) => sum + Number(p.average_class), 0) / evaluatedPrograms.length).toFixed(2)
          : '-'

        return (
          <CRow className="mb-4">
            <StatsCard
              value={totalPrograms}
              label="Total Programmes"
              icon={cilBook}
              color="primary"
            />
            <StatsCard
              value={totalStudents}
              label="Inscriptions Cours"
              icon={cilPeople}
              color="info"
            />
            <StatsCard
              value={studentsWithGrades}
              label="Étudiants avec Notes"
              icon={cilCheckCircle}
              color="success"
            />
            <StatsCard
              value={globalAverage !== '-' ? `${globalAverage} / 20` : 'N/A'}
              label="Moyenne des Classes"
              icon={cilChart}
              color="warning"
            />
          </CRow>
        )
      })()}

      {/* Filtres */}
      <CCard className="mb-4">
        <CCardHeader>
          <CIcon icon={cilFilter} className="me-2" />
          <strong>Filtres</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={3}>
              <label className="form-label">Année Académique</label>
              <Select
                options={yearOptions}
                value={yearOptions.find(opt => opt.value === selectedAcademicYear)}
                onChange={(option: any) => {
                  setSelectedAcademicYear(option?.value || null)
                  setSelectedCohort(null)
                  setSelectedProgram(null)
                }}
                placeholder="Sélectionner..."
                isSearchable
              />
            </CCol>
            <CCol md={3}>
              <label className="form-label">Cohorte</label>
              <Select
                options={cohortOptions}
                value={cohortOptions.find(opt => opt.value === selectedCohort)}
                onChange={(option: any) => setSelectedCohort(option?.value || null)}
                placeholder="Sélectionner..."
                isSearchable
                isClearable
                isDisabled={!selectedAcademicYear}
              />
            </CCol>
            <CCol md={3}>
              <label className="form-label">Filière</label>
              <Select
                options={departmentOptions}
                value={departmentOptions.find(opt => opt.value === selectedDepartment)}
                onChange={(option: any) => setSelectedDepartment(option?.value || null)}
                placeholder="Sélectionner..."
                isSearchable
                isClearable
              />
            </CCol>
            <CCol md={3}>
              <label className="form-label">Niveau</label>
              <Select
                options={levelOptions}
                value={levelOptions.find(opt => opt.value === selectedLevel)}
                onChange={(option: any) => setSelectedLevel(option?.value || null)}
                placeholder="Sélectionner..."
                isSearchable
                isClearable
              />
            </CCol>
          </CRow>
          
          <CRow>
            <CCol md={6}>
              <label className="form-label">Programme / Cours spécifique</label>
              <Select
                options={programOptions}
                value={programOptions.find(opt => opt.value === selectedProgram)}
                onChange={(option: any) => setSelectedProgram(option?.value ?? null)}
                placeholder="Tous les programmes..."
                isSearchable
                isClearable
              />
            </CCol>
            <CCol md={6} className="d-flex align-items-end">
              <CDropdown>
                <CDropdownToggle color="primary">
                  <CIcon icon={cilCloudDownload} className="me-1" />
                  Exporter par Filière
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={() => handleExport('pdf')}>
                    Export PDF
                  </CDropdownItem>
                  <CDropdownItem onClick={() => handleExport('excel')}>
                    Export Excel
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      {/* Tableau des résultats */}
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>
              {selectedProgram === null 
                ? 'Résultats par Programme (Vue d\'ensemble)' 
                : `Détail des Notes — ${programDetails?.program?.name || 'Programme'}`}
            </strong>
            {selectedProgram !== null && programDetails?.program?.class_group?.name && (
              <span className="ms-2 text-muted">({programDetails.program.class_group.name})</span>
            )}
          </div>
          {selectedProgram !== null && (
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              onClick={() => setSelectedProgram(null)}
            >
              ← Revenir à la vue d'ensemble
            </CButton>
          )}
        </CCardHeader>
        <CCardBody>
          {selectedProgram === null ? (
            // Vue d'ensemble - tous les programmes
            <div className="table-responsive">
              <CTable striped hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Programme / Matière</CTableHeaderCell>
                    <CTableHeaderCell>Classe / Niveau</CTableHeaderCell>
                    <CTableHeaderCell>Professeur</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Total Inscrits</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Avec Notes</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Moyenne Classe</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {gradesByFilters && gradesByFilters.length > 0 ? (
                    gradesByFilters.map((program: any) => (
                      <CTableRow key={program.program_id}>
                        <CTableDataCell>
                          <strong>{program.program_name}</strong>
                        </CTableDataCell>
                        <CTableDataCell>{program.class_name}</CTableDataCell>
                        <CTableDataCell>{program.professor || 'Non assigné'}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color="primary">{program.total_students || 0}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color={program.students_with_grades > 0 ? 'success' : 'secondary'}>
                            {program.students_with_grades || 0}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color={program.average_class >= 12 ? 'success' : program.average_class >= 10 ? 'info' : program.average_class ? 'danger' : 'secondary'}>
                            {program.average_class ? Number(program.average_class).toFixed(2) : '-'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CButton
                            size="sm"
                            color="info"
                            variant="outline"
                            onClick={() => setSelectedProgram(program.program_id)}
                          >
                            Consulter Notes
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center py-4 text-muted">
                        {loading ? 'Chargement...' : 'Aucun programme disponible pour ces filtres.'}
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          ) : (
            // Vue détaillée d'un programme spécifique avec vrais étudiants
            <div className="table-responsive">
              <CTable striped hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Matricule</CTableHeaderCell>
                    <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Évaluations</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Moyenne Normale</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Rattrapage</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Moyenne Finale</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {programDetails?.students && programDetails.students.length > 0 ? (
                    programDetails.students.map((student: any) => {
                      const finalAvg = student.retake_average != null ? student.retake_average : student.average
                      return (
                        <CTableRow key={student.student_pending_student_id || student.student_id}>
                          <CTableDataCell>{student.student_id || 'N/A'}</CTableDataCell>
                          <CTableDataCell>
                            <strong>{student.last_name} {student.first_names}</strong>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            {Array.isArray(student.grades) && student.grades.length > 0 ? (
                              <div className="d-flex justify-content-center gap-1">
                                {student.grades.map((g: number, idx: number) => (
                                  <CBadge key={idx} color={g >= 10 ? 'light' : 'warning'} className="border text-dark">
                                    {g >= 0 ? g : '-'}
                                  </CBadge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={student.average >= 12 ? 'success' : student.average >= 10 ? 'info' : student.average != null ? 'danger' : 'secondary'}>
                              {student.average != null ? Number(student.average).toFixed(2) : '-'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            {student.retake_average != null ? (
                              <CBadge color={student.retake_average >= 10 ? 'success' : 'danger'}>
                                {Number(student.retake_average).toFixed(2)}
                              </CBadge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={finalAvg >= 12 ? 'success' : finalAvg >= 10 ? 'info' : finalAvg != null ? 'danger' : 'secondary'}>
                              {finalAvg != null ? Number(finalAvg).toFixed(2) : '-'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={student.validated ? 'success' : 'danger'}>
                              {student.validated ? 'Validé' : 'Non validé'}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center py-4 text-muted">
                        {loading ? 'Chargement des détails...' : 'Aucun étudiant trouvé dans ce cours.'}
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default AdminDashboard