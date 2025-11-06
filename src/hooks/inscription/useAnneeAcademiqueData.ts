import { useState, useEffect } from 'react';
import InscriptionService from '../../services/inscription.service.ts';
import { formatDateReadable, formatDateTime } from '../../utils/date.utils';

const useAnneeAcademiquesData = () => {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const yearsData = await InscriptionService.academicYears();
        // Formater les dates des années académiques
        const formattedYears = yearsData.map(year => ({
          ...year,
          date_debut: formatDateReadable(year.date_debut),
          date_fin: formatDateReadable(year.date_fin),
        }));
        setAcademicYears(formattedYears || []);

        const filieresData = await InscriptionService.getFilieres();
        // getFilieres peut retourner soit un tableau soit un objet avec data
        const filieresList = Array.isArray(filieresData) ? filieresData : (filieresData || []);
        setFilieres(filieresList);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour créer une nouvelle année académique
  const createAcademicYear = async (yearStart: Date, yearEnd: Date, submissionStart?: Date | null, submissionEnd?: Date | null) => {
    try {
      // Formater les dates au format ISO (YYYY-MM-DD) pour l'API
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const data: any = {
        year_start: formatDateForAPI(yearStart),
        year_end: formatDateForAPI(yearEnd),
      };

      // Ajouter les dates de soumission seulement si elles sont fournies
      if (submissionStart && submissionEnd) {
        data.submission_start = formatDateForAPI(submissionStart);
        data.submission_end = formatDateForAPI(submissionEnd);
      }

      const response = await InscriptionService.createAcademicYear(data);
      if (response.success) {
        // Recharger les données depuis le serveur pour éviter les erreurs
        const yearsData = await InscriptionService.academicYears();
        const formattedYears = yearsData.map(year => ({
          ...year,
          date_debut: formatDateReadable(year.date_debut),
          date_fin: formatDateReadable(year.date_fin),
        }));
        setAcademicYears(formattedYears || []);
        return { success: true };
      } else {
        const errorMsg = response.error || 'Échec de la création de l\'année académique.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'année académique:', error);
      const errorMsg = error?.message || 'Une erreur est survenue lors de la création de l\'année académique.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Fonction pour ajouter une période à une année académique
  const addPeriod = async (yearId, type, startDate, startTime, endDate, endTime, selectedFilieres) => {
    try {
      const response = await InscriptionService.addPeriod(yearId, type, startDate, startTime, endDate, endTime, selectedFilieres);
      if (response.success) {
        return { success: true };
      } else {
        setError(response.error || 'Échec de l\'ajout de la période.');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la période:', error);
      // Passer l'objet d'erreur complet qui contient les erreurs de validation
      const errorData = error?.errors ? error : { message: error?.message || 'Une erreur est survenue lors de l\'ajout de la période.' };
      setError(errorData.message || 'Une erreur est survenue');
      return { success: false, error: errorData };
    }
  };

  // Fonction pour récupérer les périodes d'une année académique
  const getPeriods = async (yearId: any) => {
    try {
      const periodsData = await InscriptionService.getPeriods(yearId);
      // getPeriods peut retourner soit un tableau soit un objet
      const periodsArray = Array.isArray(periodsData) ? periodsData : (periodsData?.data || periodsData || []);
      
      if (!Array.isArray(periodsArray)) {
        console.error('periodsData is not an array:', periodsData);
        return [];
      }
      
      // Formater les dates des périodes
      const formattedPeriods = periodsArray.map(period => ({
        ...period,
        start: formatDateTime(period.start),
        end: formatDateTime(period.end),
      }));
      return formattedPeriods || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des périodes:', error);
      setError('Impossible de charger les périodes.');
      return [];
    }
  };

  return {
    academicYears,
    filieres,
    loading,
    error,
    createAcademicYear,
    addPeriod,
    getPeriods,
  };
};

export default useAnneeAcademiquesData;