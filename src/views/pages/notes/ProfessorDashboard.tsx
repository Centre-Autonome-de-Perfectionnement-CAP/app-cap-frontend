import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilBook,
  cilPlus,
  cilFile,
} from '@coreui/icons';
import { LoadingSpinner } from '@/components';
import useProfessorGrades from '@/hooks/notes/useProfessorGrades';
import useAnneeAcademiquesData from '@/hooks/inscription/useAnneeAcademiqueData';
import { useAuth } from '@/contexts';
import HttpService from '@/services/http.service';

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fullName =
    user?.full_name || (user?.prenoms && user?.nom)
      ? `${user.prenoms} ${user.nom}`
      : 'Professeur';

  const {
    classes,
    programs,
    loading,
    error,
    loadMyClasses,
    loadProgramsByClass,
  } = useProfessorGrades();

  const { academicYears } = useAnneeAcademiquesData();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [cohortOptions, setCohortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const yearOptions = useMemo(
    () => academicYears.map((year: any) => ({ value: year.id, label: year.libelle })),
    [academicYears]
  );

  useEffect(() => {
    const fetchCohorts = async () => {
      if (selectedAcademicYear) {
        try {
          const response = await HttpService.get<{ success: boolean; data: any[] }>(
            `inscription/cohortes?academic_year_id=${selectedAcademicYear}`
          );
          if (response.success) {
            setCohortOptions(response.data.map((c: any) => ({ value: c.code, label: c.code })));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des cohortes:', error);
        }
      } else {
        setCohortOptions([]);
        setSelectedCohort(null);
      }
    };
    fetchCohorts();
  }, [selectedAcademicYear]);

  useEffect(() => {
    const filters: any = {};
    if (selectedAcademicYear) filters.academic_year_id = selectedAcademicYear;
    if (selectedCohort) filters.cohort = selectedCohort;
    if (selectedClassId) filters.class_id = selectedClassId;
    loadMyClasses(Object.keys(filters).length > 0 ? filters : undefined);
  }, [selectedAcademicYear, selectedCohort, selectedClassId]);

  const handleCreateEvaluation = (programUuid: string) => {
    navigate(`/notes/professor/evaluation/${programUuid}`);
  };

  const handleViewGrades = (programUuid: string) => {
    navigate(`/notes/professor/grade-sheet/${programUuid}`);
  };

  const handleViewPrograms = async (classId: number) => {
    setSelectedClassId(classId);
    await loadProgramsByClass(classId);
  };

  if (loading && !classes.length) {
    return <LoadingSpinner fullPage message="Chargement de vos classes..." />;
  }

  return (
    <>
      {/* ── En-tête de bienvenue ── */}
      <CRow className="mb-4 align-items-center">
        <CCol>
          <h2 className="mb-1">Bonjour, {fullName}</h2>
          <p className="text-muted mb-0">
            Gérez vos notes et consultez l'emploi du temps depuis cet espace.
          </p>
        </CCol>
        
      </CRow>

      {/* Filtres et classes */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Mes classes</h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={4}>
              <label className="form-label">Année Académique</label>
              <Select
                options={yearOptions}
                value={yearOptions.find(opt => opt.value === selectedAcademicYear)}
                onChange={(option: any) => setSelectedAcademicYear(option?.value || null)}
                placeholder="Toutes les années..."
                isClearable
                isSearchable
              />
            </CCol>
            <CCol md={4}>
              <label className="form-label">Cohorte</label>
              <Select
                options={cohortOptions}
                value={cohortOptions.find(opt => opt.value === selectedCohort)}
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

          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          {classes.length > 0 ? (
            <CAccordion alwaysOpen>
              {classes.map((cycle: any, cycleIndex: number) => (
                <CAccordionItem key={cycleIndex} itemKey={cycleIndex}>
                  <CAccordionHeader>
                    <div className="d-flex justify-content-between w-100 me-3">
                      <strong>{cycle.cycle_name}</strong>
                      <CBadge color="info">
                        {cycle.departments.reduce(
                          (total: number, dept: any) => total + dept.classes.length,
                          0
                        )}{' '}
                        classe(s)
                      </CBadge>
                    </div>
                  </CAccordionHeader>
                  <CAccordionBody>
                    {cycle.departments.map((department: any, deptIndex: number) => (
                      <div key={deptIndex} className="mb-3">
                        <h6 className="mb-2">{department.department_name}</h6>
                        {department.classes.map((classGroup: any) => (
                          <div key={classGroup.id} className="mb-2 p-2 border rounded">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{classGroup.name}</strong>
                                {classGroup.level && (
                                  <span className="ms-2 text-muted">({classGroup.level})</span>
                                )}
                              </div>
                              <div>
                                <CBadge color="success" className="me-2">
                                  {classGroup.programs_count} programme(s)
                                </CBadge>
                                <CBadge color="secondary">
                                  {classGroup.students_count || 0} étudiant(s)
                                </CBadge>
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="outline"
                                  className="ms-2"
                                  onClick={() => handleViewPrograms(classGroup.id)}
                                >
                                  Voir les programmes
                                </CButton>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          ) : (
            <CAlert color="info">
              Aucune classe trouvée pour les critères sélectionnés.
            </CAlert>
          )}
        </CCardBody>
      </CCard>

      {/* Programmes de la classe sélectionnée */}
      {programs.length > 0 && (
        <CCard>
          <CCardHeader>
            <h5 className="mb-0">Programmes de la classe sélectionnée</h5>
          </CCardHeader>
          <CCardBody>
            {programs.map((program: any) => (
              <div key={program.id} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{program.course_name}</h6>
                    <small className="text-muted">Professeur : {program.professor_name}</small>
                    <div className="mt-1">
                      <CBadge color={program.column_count > 0 ? 'success' : 'warning'}>
                        {program.column_count} évaluation(s)
                      </CBadge>
                      {program.has_retake && (
                        <CBadge color="info" className="ms-2">
                          Rattrapage
                        </CBadge>
                      )}
                    </div>
                  </div>
                  <div>
                    {program.uuid && (
                      <>
                        <CButton
                          size="sm"
                          color="primary"
                          className="me-2"
                          onClick={() => handleCreateEvaluation(program.uuid)}
                        >
                          <CIcon icon={cilPlus} className="me-1" />
                          Créer évaluation
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CCardBody>
        </CCard>
      )}
    </>
  );
};

export default ProfessorDashboard;