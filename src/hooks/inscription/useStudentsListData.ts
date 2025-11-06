import { useState, useEffect } from 'react';
import InscriptionService from '../../services/inscription.service.ts';
import Swal from 'sweetalert2';
import { StudentListItem, StudentDetails, FilterOptions } from '../../types/inscription.types';

const useStudentsListData = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ years: [], filieres: [], entryDiplomas: [], redoublants: ['all', 'oui', 'non'], niveaux: {} });
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedEntryDiploma, setSelectedEntryDiploma] = useState('all');
  const [selectedRedoublant, setSelectedRedoublant] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const options = await InscriptionService.filterOptions();
        
        setFilterOptions({
          years: options.years || [],
          filieres: options.filieres || [],
          entryDiplomas: options.entryDiplomas || [],
          niveaux: options.niveaux || {},
          redoublants: ['all', 'oui', 'non'],
        });

        const response = await InscriptionService.studentsList(
          selectedYear,
          selectedFiliere,
          selectedEntryDiploma,
          selectedRedoublant,
          selectedNiveau,
          currentPage,
          searchQuery
        );
        setStudents(response.data || []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('Erreur lors du fetch des données:', error);
        setError('Impossible de charger les données.');
        setStudents([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedFiliere, selectedEntryDiploma, selectedRedoublant, selectedNiveau, currentPage, searchQuery]);

  // Réinitialiser le niveau si la filière change
  useEffect(() => {
    setSelectedNiveau('all');
  }, [selectedFiliere]);

  const getStudentDetails = async (studentId: any) => {
    try {
      const details = await InscriptionService.getStudentDetails(studentId);
      setStudentDetails(details);
      return { success: true };
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
      const response = await InscriptionService.exportList(type, selectedYear, selectedFiliere, selectedNiveau);
      if (response.success) {
        return { success: true, url: response.url };
      } else {
        setError('Échec de l\'export.');
        return { success: false };
      }
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
    error,
  };
};

export default useStudentsListData;