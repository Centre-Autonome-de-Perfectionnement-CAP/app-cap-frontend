// pages/ResponsableDashboard/ResponsableDashboard.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CCard, CCardBody, CCardHeader,
  CCol, CRow, CBadge, CAlert,
  CButton, CTable, CTableHead,
  CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CSpinner,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane,
  CInputGroup, CFormInput, CInputGroupText,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilSchool,
  cilDescription,
  cilPrint,
  cilGroup,
  cilCalendar,
  cilSearch,
  cilUser,
  cilUserFemale,
  cilClipboard,
  cilArrowLeft,
  cilWarning,
  cilCheckCircle,
  cilClock,
  cilBook,
  cilSpreadsheet,
} from '@coreui/icons';
import { useAuth } from '@/contexts/AuthContext';
import inscriptionService from '@/services/inscription.service';
import type {
  ClassGroup,
  ClassByYear,
  StudentRow,
  ProgramRow,
} from '@/services/inscription.service';
import Swal from 'sweetalert2';
import CahierTexteModal from '../../../components/CahierTexteModal/CahierTexteModal';
import './ResponsableDashboard.scss';

// ─── Contract badge helper ─────────────────────────────────────────────────────

const CONTRACT_BADGE: Record<string, { label: string; color: string }> = {
  validated: { label: 'Contrat OK',  color: 'success'   },
  pending:   { label: 'En attente',  color: 'warning'   },
  rejected:  { label: 'Rejeté',      color: 'danger'    },
  expired:   { label: 'Expiré',      color: 'secondary' },
};

// ─── View type ────────────────────────────────────────────────────────────────
type ViewMode = 'classes' | 'programs' | 'students';

// ─── Component ────────────────────────────────────────────────────────────────

const ResponsableDashboard: React.FC = () => {
  const { nom, prenoms } = useAuth();
  const fullName = [prenoms, nom].filter(Boolean).join(' ') || 'Responsable';

  // ── Classes ──────────────────────────────────────────────────────────────
  const [classesByYear, setClassesByYear]   = useState<ClassByYear[]>([]);
  const [selectedClass, setSelectedClass]   = useState<ClassGroup | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState(0);

  // ── Navigation ────────────────────────────────────────────────────────────
  // 'classes' → liste des classes
  // 'programs' → programmes d'une classe (vue principale après clic sur une classe)
  // 'students' → liste des étudiants (accessible depuis les programmes)
  const [viewMode, setViewMode]             = useState<ViewMode>('classes');

  // ── Students ──────────────────────────────────────────────────────────────
  const [students, setStudents]             = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterRedoublant, setFilterRedoublant] = useState('all');
  const [filterSexe, setFilterSexe]         = useState('all');
  const [exportLoading, setExportLoading]   = useState(false);
  const [stats, setStats] = useState({ total: 0, masculin: 0, feminin: 0, redoublants: 0, nouveaux: 0 });

  // ── Programs ──────────────────────────────────────────────────────────────
  const [programs, setPrograms]             = useState<ProgramRow[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // ── Cahier de texte modal ─────────────────────────────────────────────────
  const [textbookProgram, setTextbookProgram] = useState<ProgramRow | null>(null);

  // ── Load classes ──────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inscriptionService.getResponsableClasses();
      const classesData = response.classes_by_year || [];
      setClassesByYear(classesData);
      // On reste sur la vue 'classes' — pas de chargement automatique d'étudiants
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Impossible de charger vos classes. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── Load students ─────────────────────────────────────────────────────────
  const loadStudentsForClass = useCallback(async (classId: number) => {
    setLoadingStudents(true);
    try {
      const response = await inscriptionService.getStudentsByClass(classId);
      const list = response.students || [];
      setStudents(list);
      setStats({
        total:       list.length,
        masculin:    list.filter((s: StudentRow) => s.sexe === 'M').length,
        feminin:     list.filter((s: StudentRow) => s.sexe === 'F').length,
        redoublants: list.filter((s: StudentRow) => s.redoublant === 'Oui').length,
        nouveaux:    list.filter((s: StudentRow) => s.redoublant === 'Non').length,
      });
    } catch {
      setStudents([]);
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger la liste des étudiants.' });
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // ── Load programs ─────────────────────────────────────────────────────────
  const loadProgramsForClass = useCallback(async (classId: number) => {
    setLoadingPrograms(true);
    try {
      const response = await inscriptionService.getClassPrograms(classId);
      setPrograms(response.programs || []);
    } catch {
      setPrograms([]);
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les programmes.' });
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  // ── Click sur une classe → afficher les programmes ─────────────────────────
  const handleClassSelect = useCallback(async (classGroup: ClassGroup, yearIndex: number) => {
    setSelectedClass(classGroup);
    setActiveTab(yearIndex);
    setPrograms([]);
    setStudents([]);
    setSearchTerm('');
    setFilterRedoublant('all');
    setFilterSexe('all');
    setViewMode('programs');
    await loadProgramsForClass(classGroup.id);
  }, [loadProgramsForClass]);

  // ── Afficher les étudiants (depuis la vue programmes) ─────────────────────
  const handleShowStudents = useCallback(async () => {
    if (!selectedClass) return;
    setViewMode('students');
    if (students.length === 0) {
      await loadStudentsForClass(selectedClass.id);
    }
  }, [selectedClass, students.length, loadStudentsForClass]);

  // ── Retour programmes depuis étudiants ────────────────────────────────────
  const handleBackToPrograms = useCallback(() => {
    setViewMode('programs');
    setSearchTerm('');
    setFilterRedoublant('all');
    setFilterSexe('all');
  }, []);

  // ── Retour à la liste des classes ────────────────────────────────────────
  const handleBackToClasses = useCallback(() => {
    setSelectedClass(null);
    setPrograms([]);
    setStudents([]);
    setViewMode('classes');
  }, []);

  // ── Filtered students ─────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.nomPrenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.matricule ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchRed = filterRedoublant === 'all' ||
        (filterRedoublant === 'redoublant' && s.redoublant === 'Oui') ||
        (filterRedoublant === 'nouveau' && s.redoublant === 'Non');
      const matchSexe = filterSexe === 'all' || s.sexe === filterSexe;
      return matchSearch && matchRed && matchSexe;
    });
  }, [students, searchTerm, filterRedoublant, filterSexe]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async (type: 'presence' | 'emargement' | 'liste') => {
    if (!selectedClass) return;
    setExportLoading(true);
    try {
      const blobUrl = await inscriptionService.exportClassList(selectedClass.id, type);
      const labels = { presence: 'fiche-presence', emargement: 'fiche-emargement', liste: 'liste-etudiants' };
      const fileName = `${labels[type]}-${selectedClass.filiere}-Niveau${selectedClass.study_level}${selectedClass.group_name ? '-Groupe' + selectedClass.group_name : ''}.pdf`;
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      Swal.fire({ icon: 'success', title: 'Téléchargement réussi', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de générer le document PDF.' });
    } finally {
      setExportLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Renders
  // ─────────────────────────────────────────────────────────────────────────

  // ── Vue 1 : Sélection de classe ───────────────────────────────────────────
  const renderClassSelector = () => {
    if (classesByYear.length === 0) {
      return (
        <CAlert color="info" className="mb-4">
          <CIcon icon={cilSchool} className="me-2" />
          Aucune classe n'est assignée à votre compte. Veuillez contacter l'administration.
        </CAlert>
      );
    }

    return (
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-light">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilGroup} size="lg" className="text-primary" />
            <h5 className="mb-0">Mes classes — cliquez sur une classe pour voir ses programmes</h5>
          </div>
        </CCardHeader>
        <CCardBody>
          <CNav variant="tabs" role="tablist" className="mb-3">
            {classesByYear.map((yearData, index) => (
              <CNavItem key={yearData.academic_year_id}>
                <CNavLink active={activeTab === index} onClick={() => setActiveTab(index)} style={{ cursor: 'pointer' }}>
                  <CIcon icon={cilCalendar} className="me-2" />
                  {yearData.academic_year_name}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          <CTabContent>
            {classesByYear.map((yearData, index) => (
              <CTabPane key={yearData.academic_year_id} visible={activeTab === index}>
                <CRow className="g-3">
                  {yearData.classes.map((classGroup) => (
                    <CCol key={classGroup.id} xs={12} md={6} lg={4}>
                      <CCard
                        className={`h-100 class-card ${selectedClass?.id === classGroup.id ? 'border-primary shadow' : ''}`}
                        onClick={() => handleClassSelect(classGroup, index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CCardBody>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1 fw-bold">{classGroup.filiere}</h6>
                              <div className="d-flex gap-2 flex-wrap">
                                <CBadge color="info">Niveau {classGroup.study_level}</CBadge>
                                {classGroup.group_name && (
                                  <CBadge color="success">Groupe {classGroup.group_name}</CBadge>
                                )}
                              </div>
                            </div>
                            <div className="bg-primary bg-opacity-10 rounded p-2">
                              <CIcon icon={cilClipboard} className="text-primary" />
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted">Effectif</small>
                              <div className="fw-bold fs-5">{classGroup.total_etudiants}</div>
                            </div>
                            <div>
                              <small className="text-muted">Moy. validation</small>
                              <div className="fw-bold">{classGroup.validation_average || 'N/A'}</div>
                            </div>
                          </div>
                          {classGroup.cycle && (
                            <div className="mt-2">
                              <small className="text-muted">
                                <CIcon icon={cilSchool} size="sm" className="me-1" />
                                {classGroup.cycle}
                              </small>
                            </div>
                          )}
                          <div className="mt-3 pt-2 border-top text-center">
                            <small className="text-primary fw-semibold">
                              <CIcon icon={cilClipboard} size="sm" className="me-1" />
                              Cliquer pour voir les programmes
                            </small>
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  ))}
                </CRow>
              </CTabPane>
            ))}
          </CTabContent>
        </CCardBody>
      </CCard>
    );
  };

  // ── Vue 2 : Programmes d'une classe ──────────────────────────────────────
  const renderProgramsView = () => {
    if (!selectedClass) return null;

    return (
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <CButton color="secondary" variant="outline" size="sm" onClick={handleBackToClasses}>
                <CIcon icon={cilArrowLeft} className="me-1" />
                Mes classes
              </CButton>
              <CIcon icon={cilClipboard} className="text-primary" />
              <h5 className="mb-0">
                Programmes — {selectedClass.filiere} · Niveau {selectedClass.study_level}
                {selectedClass.group_name && ` · Gr.${selectedClass.group_name}`}
              </h5>
            </div>
            <CButton
              color="info"
              variant="outline"
              size="sm"
              onClick={handleShowStudents}
            >
              <CIcon icon={cilPeople} className="me-1" />
              Voir les étudiants ({selectedClass.total_etudiants})
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {loadingPrograms ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="mt-2 text-muted">Chargement des programmes...</p>
            </div>
          ) : programs.length === 0 ? (
            <CAlert color="info">
              <CIcon icon={cilBook} className="me-2" />
              Aucun programme enregistré pour cette classe.
            </CAlert>
          ) : (
            <CTable hover responsive className="align-middle">
              <CTableHead>
                <CTableRow className="table-light">
                  <CTableHeaderCell>ECUE</CTableHeaderCell>
                  <CTableHeaderCell>Unité d'enseignement</CTableHeaderCell>
                  <CTableHeaderCell>Enseignant</CTableHeaderCell>
                  <CTableHeaderCell>Semestre</CTableHeaderCell>
                  <CTableHeaderCell>Contrat</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Cahier de texte</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {programs.map(program => {
                  const contractBadge = program.contract_status
                    ? CONTRACT_BADGE[program.contract_status]
                    : null;

                  return (
                    <CTableRow key={program.id}>
                      <CTableDataCell>
                        <div className="fw-semibold">{program.course_element_name || '—'}</div>
                        {program.course_element_code && (
                          <small className="text-muted">{program.course_element_code}</small>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <small className="text-muted">{program.teaching_unit_name || '—'}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CIcon icon={cilUser} size="sm" className="me-1 text-muted" />
                        {program.professor_name || '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="light" textColor="dark">
                          {program.semester || '—'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {contractBadge ? (
                          <CBadge color={contractBadge.color}>{contractBadge.label}</CBadge>
                        ) : (
                          <CBadge color="secondary">Aucun</CBadge>
                        )}
                      </CTableDataCell>

                      {/* Cahier de texte */}
                      <CTableDataCell className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {/* Bouton consulter (toujours visible) */}
                          <CTooltip content="Consulter le cahier de texte">
                            <CButton
                              color="info"
                              variant="outline"
                              size="sm"
                              onClick={() => setTextbookProgram(program)}
                            >
                              <CIcon icon={cilDescription} className="me-1" />
                              ({program.textbook_entries_count})
                            </CButton>
                          </CTooltip>

                          {/* Bouton saisir (conditionnel) */}
                          {program.can_add_textbook ? (
                            <CTooltip content="Ajouter une entrée">
                              <CButton
                                color="primary"
                                size="sm"
                                onClick={() => setTextbookProgram(program)}
                              >
                                <CIcon icon={cilBook} />
                              </CButton>
                            </CTooltip>
                          ) : (
                            <CTooltip
                              content={
                                program.contract_status
                                  ? `Saisie bloquée — ${CONTRACT_BADGE[program.contract_status]?.label}`
                                  : 'Saisie bloquée — Aucun contrat'
                              }
                            >
                              <span>
                                <CButton color="secondary" size="sm" disabled>
                                  <CIcon icon={cilWarning} />
                                </CButton>
                              </span>
                            </CTooltip>
                          )}
                        </div>
                      </CTableDataCell>

                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    );
  };

  // ── Vue 3 : Étudiants d'une classe ────────────────────────────────────────
  const renderStudentsView = () => {
    if (!selectedClass) return null;

    return (
      <>
        {/* Stats bar */}
        <CRow className="g-3 mb-4">
          {[
            { icon: cilPeople,      label: 'Total',       value: stats.total,       color: 'primary'   },
            { icon: cilUser,        label: 'Masculin',    value: stats.masculin,    color: 'info'      },
            { icon: cilUserFemale,  label: 'Féminin',     value: stats.feminin,     color: 'danger'    },
            { icon: cilClipboard,   label: 'Redoublants', value: stats.redoublants, color: 'warning'   },
            { icon: cilCheckCircle, label: 'Nouveaux',    value: stats.nouveaux,    color: 'success'   },
          ].map(({ icon, label, value, color }) => (
            <CCol key={label} xs={6} md={4} lg>
              <CCard className="text-center shadow-sm h-100">
                <CCardBody className="py-3">
                  <CIcon icon={icon} size="xl" className={`text-${color} mb-2`} />
                  <div className={`fw-bold fs-4 text-${color}`}>{value}</div>
                  <small className="text-muted">{label}</small>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>

        {/* Action bar */}
        <CCard className="mb-4 shadow-sm">
          <CCardHeader>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <CButton color="secondary" variant="outline" size="sm" onClick={handleBackToPrograms}>
                  <CIcon icon={cilArrowLeft} className="me-1" />
                  Programmes
                </CButton>
                <CIcon icon={cilPeople} className="text-primary" />
                <h5 className="mb-0">
                  {selectedClass.filiere} — Niveau {selectedClass.study_level}
                  {selectedClass.group_name && ` — Groupe ${selectedClass.group_name}`}
                </h5>
                <CBadge color="primary">{filteredStudents.length} étudiant(s)</CBadge>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <CButton
                  color="primary" variant="outline" size="sm"
                  onClick={() => handleExport('presence')}
                  disabled={exportLoading}
                >
                  <CIcon icon={cilPrint} className="me-1" />
                  Fiche présence
                </CButton>
                <CButton
                  color="success" variant="outline" size="sm"
                  onClick={() => handleExport('emargement')}
                  disabled={exportLoading}
                >
                  <CIcon icon={cilPrint} className="me-1" />
                  Fiche émargement
                </CButton>
                <CButton
                  color="warning" variant="outline" size="sm"
                  onClick={() => handleExport('liste')}
                  disabled={exportLoading}
                >
                  <CIcon icon={cilDescription} className="me-1" />
                  Liste étudiants
                </CButton>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {/* Filters */}
            <CRow className="mb-3 g-2">
              <CCol xs={12} md={5}>
                <CInputGroup>
                  <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                  <CFormInput
                    placeholder="Rechercher par nom, matricule, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </CInputGroup>
              </CCol>
              <CCol xs={6} md={3}>
                <select
                  className="form-select"
                  value={filterRedoublant}
                  onChange={e => setFilterRedoublant(e.target.value)}
                >
                  <option value="all">Tous statuts</option>
                  <option value="nouveau">Nouveaux</option>
                  <option value="redoublant">Redoublants</option>
                </select>
              </CCol>
              <CCol xs={6} md={2}>
                <select
                  className="form-select"
                  value={filterSexe}
                  onChange={e => setFilterSexe(e.target.value)}
                >
                  <option value="all">Tous sexes</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </CCol>
              <CCol xs={12} md={2}>
                <CButton
                  color="secondary" variant="outline" className="w-100"
                  onClick={() => { setSearchTerm(''); setFilterRedoublant('all'); setFilterSexe('all'); }}
                >
                  Réinitialiser
                </CButton>
              </CCol>
            </CRow>

            {/* Table */}
            {loadingStudents ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <p className="mt-2 text-muted">Chargement des étudiants...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <CAlert color="info">Aucun étudiant ne correspond aux critères de filtre.</CAlert>
            ) : (
              <CTable hover responsive className="align-middle">
                <CTableHead>
                  <CTableRow className="table-light">
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Matricule</CTableHeaderCell>
                    <CTableHeaderCell>Nom & Prénoms</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Sexe</CTableHeaderCell>
                    <CTableHeaderCell>Téléphone</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredStudents.map((s, idx) => (
                    <CTableRow key={s.id}>
                      <CTableDataCell className="text-muted">{idx + 1}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="light" textColor="dark">{s.matricule || '—'}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="fw-semibold">{s.nomPrenoms}</CTableDataCell>
                      <CTableDataCell>
                        {s.email
                          ? <a href={`mailto:${s.email}`} className="text-decoration-none">{s.email}</a>
                          : '—'
                        }
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={s.sexe === 'M' ? 'info' : 'danger'}>
                          {s.sexe === 'M' ? 'M' : 'F'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{s.telephone || '—'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={s.redoublant === 'Oui' ? 'warning' : 'success'}>
                          {s.redoublant === 'Oui' ? 'Redoublant' : 'Nouveau'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Chargement de votre espace responsable...</p>
      </div>
    );
  }

  const totalClasses = classesByYear.reduce((acc, y) => acc + y.classes.length, 0);

  return (
    <div className="responsable-dashboard">
      {/* Header */}
      <CAlert color="primary" className="mb-4 d-flex align-items-center gap-3">
        <CIcon icon={cilSchool} size="xl" />
        <div>
          <h5 className="mb-0">Bienvenue, {fullName} !</h5>
          <small className="text-body-secondary">
            Vous avez accès à {totalClasses} classe(s)
          </small>
        </div>
      </CAlert>

      {/* Breadcrumb navigation */}
      {viewMode !== 'classes' && selectedClass && (
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <span
                role="button"
                className="text-primary"
                style={{ cursor: 'pointer' }}
                onClick={handleBackToClasses}
              >
                Mes classes
              </span>
            </li>
            <li className={`breadcrumb-item ${viewMode === 'programs' ? 'active' : ''}`}>
              {viewMode === 'students' ? (
                <span
                  role="button"
                  className="text-primary"
                  style={{ cursor: 'pointer' }}
                  onClick={handleBackToPrograms}
                >
                  {selectedClass.filiere} · Niv.{selectedClass.study_level}
                  {selectedClass.group_name && ` · Gr.${selectedClass.group_name}`}
                </span>
              ) : (
                <>
                  {selectedClass.filiere} · Niv.{selectedClass.study_level}
                  {selectedClass.group_name && ` · Gr.${selectedClass.group_name}`}
                </>
              )}
            </li>
            {viewMode === 'students' && (
              <li className="breadcrumb-item active">Étudiants</li>
            )}
          </ol>
        </nav>
      )}

      {/* Error */}
      {error && (
        <CAlert color="danger" className="mb-4 d-flex justify-content-between align-items-center">
          <span><CIcon icon={cilWarning} className="me-2" />{error}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={loadClasses}>
            Réessayer
          </CButton>
        </CAlert>
      )}

      {/* Views */}
      {viewMode === 'classes'   && renderClassSelector()}
      {viewMode === 'programs'  && selectedClass && renderProgramsView()}
      {viewMode === 'students'  && selectedClass && renderStudentsView()}

      {/* Cahier de texte modal */}
      {textbookProgram && (
        <CahierTexteModal
          visible={!!textbookProgram}
          onClose={() => {
            setTextbookProgram(null);
            // Rafraîchir le compteur d'entrées dans la liste des programmes
            if (selectedClass) loadProgramsForClass(selectedClass.id);
          }}
          program={textbookProgram}
        />
      )}
    </div>
  );
};

export default ResponsableDashboard;