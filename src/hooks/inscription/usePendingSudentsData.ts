import { useState, useEffect, useRef } from 'react';
import InscriptionService from '../../services/inscription.service';
import type { AcademicYear, PendingStudentData, PendingStudentsFilterOptions } from '../../types/inscription.types';

// Types pour les retours de fonctions
interface SuccessResult {
  success: true;
  url?: string;
  filename?: string;
}

interface ErrorResult {
  success: false;
  error?: string | { message: string };
}

type FunctionResult = SuccessResult | ErrorResult;

const usePendingStudentsData = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudentData[]>([]);
  const [graphesData] = useState({ inscritsParFiliere: [], admis: 0, rejetes: 0 });
  const [filterOptions, setFilterOptions] = useState<PendingStudentsFilterOptions>({ filieres: [], years: [], entryDiplomas: [], statuts: [], niveaux: [], cohorts: [] });
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedEntryDiploma, setSelectedEntryDiploma] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref pour éviter de réinitialiser la cohorte lors du chargement initial
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const yearsData = await InscriptionService.academicYears();
        setAcademicYears(yearsData || []);
        
        // Set current year as default
        if (yearsData && yearsData.length > 0 && selectedYear === 'all') {
          const currentYear = yearsData.find((y: any) => y.is_current);
          if (currentYear) {
            setSelectedYear(String(currentYear.id));
            return; // Exit early, will re-run with new selectedYear
          }
        }

        const filterData = await InscriptionService.filterOptions(selectedYear !== 'all' ? selectedYear : undefined);
        // Ne pas écraser les cohortes qui sont gérées par un useEffect séparé
        setFilterOptions(prev => ({ 
          ...filterData, 
          cohorts: prev.cohorts // Garder les cohortes existantes
        }));

        const params: any = { page: currentPage };
        
        if (selectedYear !== 'all' && selectedYear) {
          const yearId = Number(selectedYear);
          if (!isNaN(yearId)) params.academic_year_id = yearId;
        }
        
        if (selectedFiliere !== 'all' && selectedFiliere) {
          const deptId = Number(selectedFiliere);
          if (!isNaN(deptId)) params.department_id = deptId;
        }
        
        if (selectedEntryDiploma !== 'all' && selectedEntryDiploma) {
          const diplomaId = Number(selectedEntryDiploma);
          if (!isNaN(diplomaId)) params.entry_diploma_id = diplomaId;
        }
        
        if (selectedStatut !== 'all' && selectedStatut) {
          params.status = selectedStatut;
        }
        
        if (selectedCohort !== 'all' && selectedCohort) {
          params.cohort = selectedCohort;
        }
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        const studentsData = await InscriptionService.pendingStudents(params);
        setPendingStudents(studentsData.data || []);
        setTotalStudents(studentsData.meta?.total || 0);
        setTotalPages(studentsData.meta?.last_page || 1);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données.');
        setPendingStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedFiliere, selectedEntryDiploma, selectedCohort, selectedStatut, currentPage, searchQuery]);

  // Recharger les cohortes quand l'année ou la filière change
  useEffect(() => {
    const fetchCohorts = async () => {
      if (selectedYear !== 'all') {
        const departmentId = selectedFiliere !== 'all' ? selectedFiliere : undefined;
        const cohorts = await InscriptionService.getCohorts(selectedYear, departmentId);
        setFilterOptions(prev => ({ ...prev, cohorts: cohorts || [] }));
        
        // Ne pas auto-sélectionner au premier chargement
        if (isInitialMount.current) {
          isInitialMount.current = false;
          return;
        }
        
        // Si une seule cohorte, la sélectionner automatiquement
        if (cohorts && cohorts.length === 1) {
          setSelectedCohort(cohorts[0].value);
        } else if (cohorts && cohorts.length > 1) {
          // Si plusieurs cohortes et que la cohorte actuelle n'existe plus, réinitialiser
          const currentCohortExists = cohorts.some((c: any) => c.value === selectedCohort);
          if (!currentCohortExists && selectedCohort !== 'all') {
            setSelectedCohort('all');
          }
        } else {
          // Aucune cohorte disponible
          setSelectedCohort('all');
        }
      } else {
        setFilterOptions(prev => ({ ...prev, cohorts: [] }));
        if (!isInitialMount.current) {
          setSelectedCohort('all');
        }
      }
    };
    fetchCohorts();
  }, [selectedYear, selectedFiliere]);

  // Fonction pour mettre à jour les pièces d'un étudiant
  const updateStudentPieces = async (studentId: number, newPieces: any): Promise<FunctionResult> => {
    try {
      const response = await InscriptionService.updatePieces(studentId, newPieces);
      setPendingStudents(prev =>
        prev.map(student =>
          student.id === studentId ? { ...student, pieces: response.pieces } : student
        )
      );
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des pièces:', error);
      setError('Impossible de mettre à jour les pièces.');
      return { success: false, error: error?.message || String(error) };
    }
  };

  const sendStudentMail = async (studentsData: any): Promise<FunctionResult> => {
    try {
      const response = await InscriptionService.sendMail(studentsData);
      if (response.success) {
        setPendingStudents(prev =>
          prev.map(student => {
            const studentData = studentsData.find((data: any) => data.studentId === student.id);
            if (studentData) {
              // Déterminer le nouveau statut
              const isFavorable = 
                (studentData.opinionCuca && studentData.opinionCuca.toLowerCase() === 'favorable') ||
                (studentData.opinionCuo && studentData.opinionCuo.toLowerCase() === 'favorable');
              
              return {
                ...student,
                mailCucaEnvoye: studentData.opinionCuca ? 'Oui' : student.mailCucaEnvoye,
                mailCucaCount: studentData.opinionCuca ? (student.mailCucaCount || 0) + 1 : student.mailCucaCount,
                mailCuoEnvoye: studentData.opinionCuo ? 'Oui' : student.mailCuoEnvoye,
                mailCuoCount: studentData.opinionCuo ? (student.mailCuoCount || 0) + 1 : student.mailCuoCount,
                opinionCuca: studentData.opinionCuca || student.opinionCuca,
                commentaireCuca: studentData.commentaireCuca || student.commentaireCuca,
                opinionCuo: studentData.opinionCuo || student.opinionCuo,
                commentaireCuo: studentData.commentaireCuo || student.commentaireCuo,
                status: isFavorable ? 'approved' : student.status,
              };
            }
            return student;
          })
        );
        return { success: true };
      } else {
        setError('Échec de l\'envoi du mail.');
        return { success: false, error: 'Échec de l\'envoi du mail.' };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du mail:', error);
      setError('Une erreur est survenue lors de l\'envoi du mail.');
      return { success: false, error: error?.message || String(error) };
    }
  };

  // Fonction pour exporter les données
  const exportData = async (format: any): Promise<FunctionResult> => {
    try {
      let endpoint = '';
      
      if (format === 'emails') {
        // Pour l'export des emails, on utilise un endpoint spécifique
        endpoint = `/inscription/export/emails?year=${selectedYear}`;
        if (selectedFiliere !== 'all') {
          endpoint += `&filiere=${selectedFiliere}`;
        }
        if (selectedCohort !== 'all') {
          endpoint += `&cohort=${selectedCohort}`;
        }
      } else if (format === 'validated-students') {
        // Pour l'export des étudiants validés CUO, seule l'année est nécessaire
        endpoint = `/inscription/export/validated-students?year=${selectedYear}`;
      } else if (format.startsWith('validated-students-')) {
        // Pour l'export des étudiants validés par type
        const type = format.replace('validated-students-', '');
        endpoint = `/inscription/export/validated-students?year=${selectedYear}&type=${type}`;
      } else {
        // Pour les autres formats
        endpoint = `/inscription/export/${format}?year=${selectedYear}&filiere=${selectedFiliere}`;
        // N'ajouter cohort que si ce n'est pas 'all'
        if (selectedCohort !== 'all') {
          endpoint += `&cohort=${selectedCohort}`;
        }
      }
      
      const response = await InscriptionService.exportData(endpoint);
      if (response.success) {
        return { success: true, url: response.url, filename: response.filename };
      } else {
        setError('Échec de l\'export.');
        return { success: false, error: 'Échec de l\'export.' };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      const errorMessage = error?.message || String(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction pour mettre à jour le statut financier d'un étudiant (exonéré/sponsorisé)
  const updateStudentStatus = async (studentId: number, field: 'exonere' | 'sponsorise', checked: boolean): Promise<FunctionResult> => {
    try {
      const data = {
        [field]: checked ? 'Oui' : 'Non'
      };
      await InscriptionService.updateFinancialStatus(studentId, data);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Impossible de mettre à jour le statut.');
      return { success: false, error: error?.message || String(error) };
    }
  };

  // Fonction pour mettre à jour le niveau d'études
  const updateStudentLevel = async (studentId: number, level: string): Promise<FunctionResult> => {
    try {
      await InscriptionService.updateLevel(studentId, level);
      setPendingStudents(prev =>
        prev.map(student =>
          student.id === studentId ? { ...student, level } : student
        )
      );
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du niveau:', error);
      setError('Impossible de mettre à jour le niveau.');
      return { success: false, error: error?.message || String(error) };
    }
  };

  // Fonction pour renommer une pièce
  const renamePiece = async (studentId: number, pieceKey: string, customName: string): Promise<FunctionResult> => {
    try {
      await InscriptionService.renamePiece(studentId, pieceKey, customName);
      setPendingStudents(prev =>
        prev.map(student =>
          student.id === studentId
            ? {
                ...student,
                documents: {
                  ...student.documents,
                  [pieceKey]: {
                    ...(typeof student.documents?.[pieceKey] === 'object' ? student.documents[pieceKey] : { url: student.documents?.[pieceKey] }),
                    custom_name: customName
                  }
                }
              }
            : student
        )
      );
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du renommage de la pièce:', error);
      setError('Impossible de renommer la pièce.');
      return { success: false, error: error?.message || String(error) };
    }
  };

  return {
    academicYears,
    pendingStudents,
    graphesData,
    filterOptions,
    selectedYear,
    setSelectedYear,
    selectedFiliere,
    setSelectedFiliere,
    selectedEntryDiploma,
    setSelectedEntryDiploma,
    selectedCohort,
    setSelectedCohort,
    selectedStatut,
    setSelectedStatut,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalStudents,
    totalPages,
    loading,
    error,
    updateStudentPieces,
    sendStudentMail,
    exportData,
    updateStudentStatus,
    updateStudentLevel,
    renamePiece,
  };
};

export default usePendingStudentsData;