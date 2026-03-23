// pages/ResponsableDashboard/ResponsableDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  CCard, CCardBody, CCardHeader,
  CCol, CRow, CBadge, CAlert,
  CButton, CTable, CTableHead,
  CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CSpinner,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane,
  CProgress, CProgressBar,
  CInputGroup, CFormInput, CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilPeople, 
  cilSchool, 
  cilDescription, 
  cilPrint, 
  cilGroup,
  cilCalendar,
  cilFilter,
  cilSearch,
  cilUser,
  cilUserFemale,
  cilUserUnfollow,
  cilClipboard,
  cilZoom,
} from '@coreui/icons';
import { useAuth } from '@/contexts/AuthContext';
import inscriptionService from '@/services/inscription.service';
import type { 
  ClassGroup, 
  ClassByYear, 
  StudentRow 
} from '@/services/inscription.service';
import Swal from 'sweetalert2';
import './ResponsableDashboard.scss';

const ResponsableDashboard: React.FC = () => {
  // ✅ AuthContext expose nom et prenoms directement (pas un objet 'user')
  const { nom, prenoms } = useAuth();
  const fullName = [prenoms, nom].filter(Boolean).join(' ') || 'Responsable';

  // États
  const [classesByYear, setClassesByYear] = useState<ClassByYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRedoublant, setFilterRedoublant] = useState<string>('all');
  const [filterSexe, setFilterSexe] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    masculin: 0,
    feminin: 0,
    redoublants: 0,
    nouveaux: 0
  });

  // Chargement initial des données
  useEffect(() => {
    loadClasses();
  }, []);

  // Charger les classes du responsable
  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Plus de cache dans le contexte — on appelle toujours l'API directement
      const response = await inscriptionService.getResponsableClasses();
        const classesData = response.classes_by_year || [];
        setClassesByYear(classesData);
        
        if (classesData.length > 0) {
          if (classesData[0]?.classes?.length > 0) {
            const firstClass = classesData[0].classes[0];
            setSelectedClass(firstClass);
            setActiveTab(0);
            await loadStudentsForClass(firstClass.id);
          }
        }
    } catch (err: any) {
      console.error('Erreur chargement classes:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Impossible de charger vos classes. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les étudiants d'une classe spécifique
  const loadStudentsForClass = async (classId: number) => {
    setLoadingStudents(true);
    try {
      const response = await inscriptionService.getStudentsByClass(classId);
      const studentsList = response.students || [];
      setStudents(studentsList);
      
      // Calculer les statistiques
      calculateStats(studentsList);
    } catch (err: any) {
      console.error('Erreur chargement étudiants:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger la liste des étudiants.'
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (studentsList: StudentRow[]) => {
    const total = studentsList.length;
    const masculin = studentsList.filter(s => s.sexe === 'M').length;
    const feminin = studentsList.filter(s => s.sexe === 'F').length;
    const redoublants = studentsList.filter(s => s.redoublant === 'Oui').length;
    const nouveaux = total - redoublants;

    setStats({ total, masculin, feminin, redoublants, nouveaux });
  };

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtre par recherche textuelle
      const matchesSearch = searchTerm === '' || 
        student.nomPrenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par statut (redoublant/nouveau)
      const matchesRedoublant = filterRedoublant === 'all' || 
        (filterRedoublant === 'redoublant' && student.redoublant === 'Oui') ||
        (filterRedoublant === 'nouveau' && student.redoublant === 'Non');
      
      // Filtre par sexe
      const matchesSexe = filterSexe === 'all' || student.sexe === filterSexe;
      
      return matchesSearch && matchesRedoublant && matchesSexe;
    });
  }, [students, searchTerm, filterRedoublant, filterSexe]);

  // Changer de classe
  const handleClassChange = async (classGroup: ClassGroup, yearIndex: number) => {
    setSelectedClass(classGroup);
    setActiveTab(yearIndex);
    setSearchTerm('');
    setFilterRedoublant('all');
    setFilterSexe('all');
    await loadStudentsForClass(classGroup.id);
  };

  // Exporter les listes
  const handleExport = async (type: 'presence' | 'emargement' | 'liste') => {
    if (!selectedClass) return;
    
    setExportLoading(true);
    try {
      const blobUrl = await inscriptionService.exportClassList(
        selectedClass.id, 
        type
      );
      
      const labels = {
        presence: 'fiche-presence',
        emargement: 'fiche-emargement',
        liste: 'liste-etudiants'
      };
      
      const fileName = `${labels[type]}-${selectedClass.filiere}-Niveau${selectedClass.study_level}${selectedClass.group_name ? '-Groupe' + selectedClass.group_name : ''}.pdf`;
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      
      Swal.fire({
        icon: 'success',
        title: 'Téléchargement réussi',
        text: 'Le document a été généré avec succès.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Erreur export:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de générer le document PDF.'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterRedoublant('all');
    setFilterSexe('all');
  };

  // Rendu du sélecteur de classes
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
            <h5 className="mb-0">Mes classes par année académique</h5>
          </div>
        </CCardHeader>
        <CCardBody>
          <CNav variant="tabs" role="tablist" className="mb-3">
            {classesByYear.map((yearData, index) => (
              <CNavItem key={yearData.academic_year_id}>
                <CNavLink
                  active={activeTab === index}
                  onClick={() => setActiveTab(index)}
                >
                  <CIcon icon={cilCalendar} className="me-2" />
                  {yearData.academic_year_name}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          <CTabContent>
            {classesByYear.map((yearData, index) => (
              <CTabPane
                key={yearData.academic_year_id}
                visible={activeTab === index}
              >
                <CRow className="g-3">
                  {yearData.classes.map((classGroup) => (
                    <CCol key={classGroup.id} xs={12} md={6} lg={4}>
                      <CCard
                        className={`h-100 class-card ${selectedClass?.id === classGroup.id ? 'border-primary shadow' : ''}`}
                        onClick={() => handleClassChange(classGroup, index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CCardBody>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">{classGroup.filiere}</h6>
                              <div className="d-flex gap-2 flex-wrap">
                                <CBadge color="info">
                                  Niveau {classGroup.study_level}
                                </CBadge>
                                {classGroup.group_name && (
                                  <CBadge color="success">
                                    Groupe {classGroup.group_name}
                                  </CBadge>
                                )}
                              </div>
                            </div>
                            <div className="bg-primary bg-opacity-10 rounded p-2">
                              <CIcon icon={cilPeople} className="text-primary" />
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted">Effectif</small>
                              <div className="fw-bold fs-5">
                                {classGroup.total_etudiants}
                              </div>
                            </div>
                            <div>
                              <small className="text-muted">Moyenne validation</small>
                              <div className="fw-bold">
                                {classGroup.validation_average || 'N/A'}
                              </div>
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

  // Rendu de la vue d'une classe sélectionnée
  const renderClassView = () => {
    if (!selectedClass) return null;

    return (
      <>
        {/* En-tête de la classe */}
        <CCard className="mb-4 bg-gradient-primary text-white">
          <CCardBody>
            <CRow className="align-items-center">
              <CCol md={8}>
                <h3 className="mb-2">
                  {selectedClass.filiere} - Niveau {selectedClass.study_level}
                  {selectedClass.group_name && (
                    <CBadge color="light" className="ms-2 text-dark">
                      Groupe {selectedClass.group_name}
                    </CBadge>
                  )}
                </h3>
                <div className="d-flex gap-4 flex-wrap">
                  <div>
                    <CIcon icon={cilCalendar} className="me-1" />
                    {selectedClass.academic_year_name}
                  </div>
                  <div>
                    <CIcon icon={cilPeople} className="me-1" />
                    {stats.total} étudiants
                  </div>
                  {selectedClass.cycle && (
                    <div>
                      <CIcon icon={cilSchool} className="me-1" />
                      {selectedClass.cycle}
                    </div>
                  )}
                </div>
              </CCol>
              <CCol md={4}>
                <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0 flex-wrap">
                  <CButton
                    color="light"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('liste')}
                    disabled={exportLoading || students.length === 0}
                  >
                    {exportLoading ? <CSpinner size="sm" /> : <CIcon icon={cilPrint} className="me-1" />}
                    Liste
                  </CButton>
                  <CButton
                    color="light"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('presence')}
                    disabled={exportLoading || students.length === 0}
                  >
                    {exportLoading ? <CSpinner size="sm" /> : <CIcon icon={cilClipboard} className="me-1" />}
                    Présence
                  </CButton>
                  <CButton
                    color="light"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('emargement')}
                    disabled={exportLoading || students.length === 0}
                  >
                    {exportLoading ? <CSpinner size="sm" /> : <CIcon icon={cilDescription} className="me-1" />}
                    Émargement
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Statistiques */}
        <CRow className="mb-4 g-3">
          <CCol xs={6} md={3}>
            <CCard className="border-start border-info border-3 h-100">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">Total</small>
                    <h3 className="mb-0 text-info">{stats.total}</h3>
                  </div>
                  <CIcon icon={cilPeople} className="text-info" size="xl" />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          
          <CCol xs={6} md={3}>
            <CCard className="border-start border-primary border-3 h-100">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">Masculin</small>
                    <h3 className="mb-0 text-primary">{stats.masculin}</h3>
                  </div>
                  <CIcon icon={cilUser} className="text-primary" size="xl" />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          
          <CCol xs={6} md={3}>
            <CCard className="border-start border-danger border-3 h-100">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">Féminin</small>
                    <h3 className="mb-0 text-danger">{stats.feminin}</h3>
                  </div>
                  <CIcon icon={cilUserFemale} className="text-danger" size="xl" />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          
          <CCol xs={6} md={3}>
            <CCard className="border-start border-warning border-3 h-100">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">Redoublants</small>
                    <h3 className="mb-0 text-warning">{stats.redoublants}</h3>
                  </div>
                  <CIcon icon={cilUserUnfollow} className="text-warning" size="xl" />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Filtres et recherche */}
        <CCard className="mb-4">
          <CCardHeader className="bg-light">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilFilter} />
              <h6 className="mb-0">Filtres</h6>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={5}>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Rechercher par nom, matricule ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CInputGroup>
              </CCol>
              
              <CCol md={3}>
                <CInputGroup>
                  <CInputGroupText>Statut</CInputGroupText>
                  <select
                    className="form-select"
                    value={filterRedoublant}
                    onChange={(e) => setFilterRedoublant(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="nouveau">Nouveaux</option>
                    <option value="redoublant">Redoublants</option>
                  </select>
                </CInputGroup>
              </CCol>
              
              <CCol md={3}>
                <CInputGroup>
                  <CInputGroupText>Sexe</CInputGroupText>
                  <select
                    className="form-select"
                    value={filterSexe}
                    onChange={(e) => setFilterSexe(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </CInputGroup>
              </CCol>
              
              <CCol md={1}>
                <CButton 
                  color="secondary" 
                  variant="outline" 
                  className="w-100"
                  onClick={resetFilters}
                >
                  Reset
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Liste des étudiants */}
        <CCard className="shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="fw-bold">
              <CIcon icon={cilPeople} className="me-2" />
              Liste des étudiants ({filteredStudents.length} sur {stats.total})
            </span>
            <CBadge color="info">
              {filteredStudents.length === stats.total ? 'Tous' : 'Filtrés'}
            </CBadge>
          </CCardHeader>

          <CCardBody>
            {loadingStudents ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <p className="mt-2">Chargement des étudiants...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <CAlert color="warning" className="mb-0">
                <CIcon icon={cilZoom} className="me-2" />
                Aucun étudiant ne correspond à vos critères de recherche.
              </CAlert>
            ) : (
              <>
                <div className="table-responsive">
                  <CTable hover striped>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>#</CTableHeaderCell>
                        <CTableHeaderCell>Matricule</CTableHeaderCell>
                        <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                        <CTableHeaderCell>Email</CTableHeaderCell>
                        <CTableHeaderCell>Sexe</CTableHeaderCell>
                        <CTableHeaderCell>Statut</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredStudents.map((student, index) => (
                        <CTableRow key={student.id}>
                          <CTableDataCell>{index + 1}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="dark">{student.matricule || 'N/A'}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="fw-semibold">
                            {student.nomPrenoms}
                          </CTableDataCell>
                          <CTableDataCell>{student.email}</CTableDataCell>
                          <CTableDataCell>
                            {student.sexe === 'M' ? (
                              <CBadge color="primary">Masculin</CBadge>
                            ) : (
                              <CBadge color="danger">Féminin</CBadge>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            {student.redoublant === 'Oui' ? (
                              <CBadge color="warning">Redoublant</CBadge>
                            ) : (
                              <CBadge color="success">Nouveau</CBadge>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="info"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Détails de l\'étudiant',
                                  html: `
                                    <div style="text-align: left">
                                      <p><strong>Matricule:</strong> ${student.matricule || 'N/A'}</p>
                                      <p><strong>Nom complet:</strong> ${student.nomPrenoms}</p>
                                      <p><strong>Email:</strong> ${student.email}</p>
                                      <p><strong>Sexe:</strong> ${student.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                                      <p><strong>Statut:</strong> ${student.redoublant === 'Oui' ? 'Redoublant' : 'Nouveau'}</p>
                                      ${student.telephone ? `<p><strong>Téléphone:</strong> ${student.telephone}</p>` : ''}
                                    </div>
                                  `,
                                  icon: 'info'
                                });
                              }}
                            >
                              <CIcon icon={cilZoom} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>

                {/* Progression */}
                {stats.total > 0 && (
                  <div className="mt-3">
                    <small className="text-muted">Répartition par sexe</small>
                    <CProgress className="mt-1" height={20}>
                      <CProgressBar
                        color="primary"
                        value={(stats.masculin / stats.total) * 100}
                      >
                        {stats.masculin} M
                      </CProgressBar>
                      <CProgressBar
                        color="danger"
                        value={(stats.feminin / stats.total) * 100}
                      >
                        {stats.feminin} F
                      </CProgressBar>
                    </CProgress>
                  </div>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </>
    );
  };

  // Rendu principal
  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Chargement de votre espace responsable...</p>
      </div>
    );
  }

  return (
    <div className="responsable-dashboard">
      {/* En-tête de bienvenue */}
      <CAlert color="primary" className="mb-4 d-flex align-items-center gap-3">
        <CIcon icon={cilSchool} size="xl" />
        <div>
          <h5 className="mb-0">Bienvenue, {fullName} !</h5>
          <small className="text-body-secondary">
            Vous avez accès à {classesByYear.reduce((acc, year) => acc + year.classes.length, 0)} classe(s)
          </small>
        </div>
      </CAlert>

      {/* Message d'erreur */}
      {error && (
        <CAlert color="danger" className="mb-4 d-flex justify-content-between align-items-center">
          <span>
            <CIcon icon={cilDescription} className="me-2" />
            {error}
          </span>
          <CButton color="danger" variant="outline" size="sm" onClick={loadClasses}>
            Réessayer
          </CButton>
        </CAlert>
      )}

      {/* Sélecteur de classes */}
      {renderClassSelector()}

      {/* Vue de la classe sélectionnée */}
      {selectedClass && renderClassView()}
    </div>
  );
};

export default ResponsableDashboard;