import { useState, useEffect, useRef } from 'react';
import InscriptionService from '../../services/inscription.service.ts';
import Swal from 'sweetalert2';
import { StudentListItem, StudentDetails, FilterOptions } from '../../types/inscription.types';

const useStudentsListData = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ years: [], filieres: [], entryDiplomas: [], redoublants: ['all', 'oui', 'non'], niveaux: [], cohorts: [] });
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedEntryDiploma, setSelectedEntryDiploma] = useState('all');
  const [selectedRedoublant, setSelectedRedoublant] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  /** Premier chargement terminé : ensuite la page reste affichée pendant les recherches. */
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options des filtres : seulement quand l'année change (pas à chaque lettre tapée).
  useEffect(() => {
    let alive = true;
    InscriptionService.filterOptions(selectedYear !== 'all' ? selectedYear : undefined)
      .then(options => {
        if (!alive) return;
        setFilterOptions({
          years: options.years || [],
          filieres: options.filieres || [],
          entryDiplomas: options.entryDiplomas || [],
          niveaux: options.niveaux || [],
          cohorts: options.cohorts || [],
          redoublants: ['all', 'oui', 'non'],
        });
      })
      .catch(() => { if (alive) setError('Impossible de charger les filtres.'); });
    return () => { alive = false; };
  }, [selectedYear]);

  // Liste : rechargée sur place ; une réponse arrivée après une recherche plus récente est ignorée.
  const requestId = useRef(0);
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    InscriptionService.studentsList(
      selectedYear,
      selectedFiliere,
      selectedEntryDiploma,
      selectedRedoublant,
      selectedNiveau,
      currentPage,
      searchQuery,
      undefined,
      selectedCohort
    )
      .then(response => {
        if (id !== requestId.current) return;
        setStudents(response.data || []);
        setTotalPages(response.totalPages || 1);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setError('Impossible de charger les données.');
        setStudents([]);
        setTotalPages(1);
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
        setLoadedOnce(true);
      });
  }, [selectedYear, selectedFiliere, selectedEntryDiploma, selectedRedoublant, selectedNiveau, selectedCohort, currentPage, searchQuery]);

  // Réinitialiser le niveau si la filière change
  useEffect(() => {
    setSelectedNiveau('all');
  }, [selectedFiliere]);

  const getStudentDetails = async (studentId: any) => {
    try {
      const details = await InscriptionService.getStudentDetails(studentId);
      setStudentDetails(details);
      return { success: true, data: details };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
      setError('Impossible de charger les détails de l\'étudiant.');
      return { success: false };
    }
  };

  const exportList = async (type: any) => {
    if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all') {
      Swal.fire({
        icon: 'warning',
        title: 'Sélection requise',
        text: 'Veuillez sélectionner une année académique, une filière et un niveau avant d\'exporter.',
      });
      return { success: false };
    }
    try {
      const blob = await InscriptionService.exportList(type, selectedYear, selectedFiliere, selectedNiveau, selectedCohort || 'all') as unknown as Blob;
      // Create a download URL from the Blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${selectedFiliere}_${selectedNiveau}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, url };
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Une erreur est survenue lors de l\'export.');
      return { success: false };
    }
  };

  const updateStudent = async (studentId: number, data: any) => {
    try {
      const response = await InscriptionService.updateStudent(studentId, data);
      if (response.success) {
        // Rafraîchir les données de l'étudiant
        await getStudentDetails(studentId);
        return { success: true };
      }
      return { success: false, error: response.message || 'Échec de la mise à jour' };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.' 
      };
    }
  };

  return {
    students,
    filterOptions,
    selectedYear,
    setSelectedYear,
    selectedFiliere,
    setSelectedFiliere,
    selectedEntryDiploma,
    setSelectedEntryDiploma,
    selectedRedoublant,
    setSelectedRedoublant,
    selectedNiveau,
    setSelectedNiveau,
    selectedCohort,
    setSelectedCohort,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    studentDetails,
    getStudentDetails,
    updateStudent,
    exportList,
    loading,
    loadedOnce,
    error,
  };
};

export default useStudentsListData;