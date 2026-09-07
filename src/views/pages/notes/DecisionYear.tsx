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
  CButtonGroup
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilFilter } from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData'
import useFiltersData from '@/hooks/inscription/useFiltersData'
import useAdminGrades from '@/hooks/notes/useAdminGrades'
import useDecisionData from '@/hooks/notes/useDecisionData'
import notesService from '@/services/notes.service'

const DecisionYear = () => {
  const { academicYears } = useAnneeAcademiquesData()
  const { exportPVFinAnnee } = useAdminGrades()

  // États pour les filtres
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)

  // États pour les décisions
  const [decisions, setDecisions] = useState<Record<number, string>>({})
  
  const { students, loading, error } = useDecisionData(
    selectedAcademicYear,
    selectedDepartment,
    selectedLevel,
    selectedCohort
  )

  // Options pour les sélecteurs
  const yearOptions = useMemo(() => {
    return academicYears.map((year: any) => ({
      value: year.id,
      label: year.libelle
    }))
  }, [academicYears])

  const { departments, levels, cohorts } = useFiltersData(selectedAcademicYear)

  const departmentOptions = useMemo(() => {
    return departments.map((dept: any) => ({
      value: dept.id,
      label: dept.title || dept.name
    }))
  }, [departments])

  const levelOptions = useMemo(() => {
    return levels.map((level: any) => ({
      value: level.value,
      label: level.label
    }))
  }, [levels])

  const decisionOptions = [
    'Admis',
    'Admis avec dette',
    'Redouble',
    'Exclu',
    'Diplômé'
  ]

  const cohortOptions = useMemo(() => {
    return cohorts.map((cohort: any) => {
      const cohortValue = typeof cohort === 'string' ? cohort : (cohort.cohort || cohort.value || cohort)
      return {
        value: cohortValue,
        label: cohortValue
      }
    })
  }, [cohorts])

  // Charger l'année académique courante par défaut
  useEffect(() => {
    const currentYear = academicYears.find((year: any) => year.is_current)
    if (currentYear) {
      setSelectedAcademicYear(currentYear.id)
    }
  }, [academicYears])

  const handleDecisionChange = (studentId: number, decision: string) => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: decision
    }))
  }

  const getDecisionColor = (decision: string): string => {
    switch (decision) {
      case 'Admis': 
      case 'Diplômé': return 'success'
      case 'Admis avec dette': return 'warning'
      case 'Redouble': return 'info'
      case 'Exclu': return 'danger'
      default: return 'secondary'
    }
  }

  const getAutomaticDecision = (
    moyenneAnnuelle: number, 
    creditsTotal: number, 
    maxCredits: number,
    level: string
  ): string => {
    const creditPercentage = (creditsTotal / maxCredits) * 100
    const isFinalLevel = level === 'L3' || level === 'M2'
    
    if (moyenneAnnuelle >= 12 && creditPercentage >= 90) {
      return isFinalLevel ? 'Diplômé' : 'Admis'
    }
    if (moyenneAnnuelle >= 10 && creditPercentage >= 70) {
      return isFinalLevel ? 'Admis avec dette' : 'Admis avec dette'
    }
    if (moyenneAnnuelle >= 8) return 'Redouble'
    return 'Exclu'
  }

  const handleSaveDecisions = async () => {
    if (!selectedAcademicYear) return
    // setLoading(true) // Fonction non disponible dans ce contexte
    try {
      const decisionsArray = Object.entries(decisions).map(([studentId, decision]) => {
        const studentObj = students.find(s => s.id === parseInt(studentId))
        return {
          student_id: parseInt(studentId),
          student_pending_student_id: (studentObj as any)?.student_pending_student_id,
          decision,
          year_decision: decision
        }
      })
      
      await notesService.saveYearDecisions({
        academic_year_id: selectedAcademicYear,
        decisions: decisionsArray
      })
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err)
    } finally {
      // Fin
    }
  }

  const handleAutoDecisions = () => {
    const autoDecisions: Record<number, string> = {}
    students.forEach(student => {
      autoDecisions[student.id] = getAutomaticDecision(
        student.moyenneAnnuelle || 0,
        (student.creditsS1 || 0) + (student.creditsS2 || 0),
        student.totalCredits || 60,
        student.level || 'L1'
      )
    })
    setDecisions(autoDecisions)
  }

  const handleExportPV = async () => {
    if (!selectedAcademicYear || !selectedDepartment || !selectedLevel) return
    try {
      const result = await exportPVFinAnnee({
        academic_year_id: selectedAcademicYear,
        department_id: selectedDepartment,
        level: selectedLevel || undefined,
        cohort: selectedCohort || undefined,
        validation_average: 10
      })
      
      if (result.success && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.filename || `PV_Fin_Annee.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(result.url)
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'export:', err)
    } finally {
      // Fin
    }
  }

  const isFiltersComplete = selectedAcademicYear && selectedDepartment && selectedLevel

  console.log('DecisionYear - Filters:', {
    selectedAcademicYear,
    selectedDepartment,
    selectedLevel,
    selectedCohort,
    isFiltersComplete
  })

  return (
    <>
      <CRow className="mb-4">
        <CCol>
          <h2>Décisions Annuelles</h2>
          <p className="text-muted">
            Définissez les décisions de fin d'année pour chaque étudiant
          </p>
        </CCol>
      </CRow>

      {/* Filtres */}
      <CCard className="mb-4">
        <CCardHeader>
          <CIcon icon={cilFilter} className="me-2" />
          <strong>Filtres</strong>
        </CCardHeader>
        <CCardBody>
          <CRow>
            <CCol md={3}>
              <label className="form-label">Année Académique</label>
              <Select
                options={yearOptions}
                value={yearOptions.find(opt => opt.value === selectedAcademicYear)}
                onChange={(option: any) => setSelectedAcademicYear(option?.value || null)}
                placeholder="Sélectionner..."
                isSearchable
              />
            </CCol>
            <CCol md={2}>
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
            <CCol md={2}>
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
            <CCol md={2}>
              <label className="form-label">Cohorte</label>
              <Select
                options={cohortOptions}
                value={cohortOptions.find(opt => opt.value === selectedCohort)}
                onChange={(option: any) => setSelectedCohort(option?.value || null)}
                placeholder="Sélectionner..."
                isSearchable
                isClearable
              />
            </CCol>
            <CCol md={3} className="d-flex align-items-end gap-2">
              <CButton
                color="info"
                variant="outline"
                onClick={handleAutoDecisions}
                className="flex-grow-1"
                disabled={!isFiltersComplete}
              >
                Décisions Auto
              </CButton>
              <CButton
                color="success"
                onClick={handleExportPV}
                disabled={!isFiltersComplete || loading}
              >
                Export PV
              </CButton>
            </CCol>
          </CRow>
          {!isFiltersComplete && (
            <CAlert color="info" className="mt-3 mb-0">
              Veuillez sélectionner les filtres obligatoires (Année, Filière, Niveau) pour afficher les étudiants et délibérer.
            </CAlert>
          )}
        </CCardBody>
      </CCard>

      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      {/* Tableau des décisions */}
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Décisions Annuelles</strong>
          <CButton
            color="primary"
            onClick={handleSaveDecisions}
            disabled={loading || Object.keys(decisions).length === 0}
          >
            <CIcon icon={cilSave} className="me-1" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </CButton>
        </CCardHeader>
        <CCardBody>
          <div className="table-responsive">
            <CTable striped hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Niveau</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Moy. S1</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Moy. S2</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Moy. Annuelle</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Crédits</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Décision Suggérée</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Décision Finale</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {students.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      Sélectionnez les filtres pour afficher les étudiants
                    </CTableDataCell>
                  </CTableRow>
                ) : students.map((student) => {
                  const suggestedDecision = getAutomaticDecision(
                    student.moyenneAnnuelle || 0,
                    (student.creditsS1 || 0) + (student.creditsS2 || 0),
                    student.totalCredits,
                    student.level || 'L1'
                  )
                  const finalDecision = decisions[student.id] || ''

                  return (
                    <CTableRow key={student.id}>
                      <CTableDataCell>{student.matricule}</CTableDataCell>
                      <CTableDataCell>
                        <strong>{student.nom}</strong><br />
                        <small className="text-muted">{student.prenoms}</small>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color="info">{student.level}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={(student.moyenneS1 || 0) >= 10 ? 'success' : 'danger'}>
                          {(student.moyenneS1 || 0).toFixed(2)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={(student.moyenneS2 || 0) >= 10 ? 'success' : 'danger'}>
                          {(student.moyenneS2 || 0).toFixed(2)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={(student.moyenneAnnuelle || 0) >= 10 ? 'success' : 'danger'}>
                          <strong>{(student.moyenneAnnuelle || 0).toFixed(2)}</strong>
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <span className={((student.creditsS1 || 0) + (student.creditsS2 || 0)) >= student.totalCredits * 0.8 ? 'text-success' : 'text-warning'}>
                          {(student.creditsS1 || 0) + (student.creditsS2 || 0)}/{student.totalCredits}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={getDecisionColor(suggestedDecision)}>
                          {suggestedDecision}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <select
                          className="form-select form-select-sm"
                          value={finalDecision}
                          onChange={(e) => handleDecisionChange(student.id, e.target.value)}
                        >
                          <option value="">Choisir...</option>
                          {decisionOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>
    </>
  )
}

export default DecisionYear