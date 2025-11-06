import { useState, useEffect } from 'react';
import FinanceService from '../../services/finance.service';
import type { Paiement, PaiementFilters, PaiementMeta } from '../../types/finance.types';

const usePaiementsData = (initialFilters: PaiementFilters = {}) => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [meta, setMeta] = useState<PaiementMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaiementFilters>(initialFilters);

  const fetchPaiements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await FinanceService.getPaiements(filters);
      setPaiements(response.data || []);
      setMeta(response.meta || null);
    } catch (error: any) {
      console.error('Erreur lors du chargement des paiements:', error);
      setError(error?.message || 'Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, [filters]);

  const updateFilters = (newFilters: Partial<PaiementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const createPaiement = async (data: any) => {
    try {
      const response = await FinanceService.createPaiement(data);
      if (response.success) {
        await fetchPaiements();
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error || 'Échec de la création du paiement.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du paiement:', error);
      const errorMsg = error?.message || 'Une erreur est survenue lors de la création du paiement.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const getPaiementByReference = async (reference: string) => {
    try {
      const paiement = await FinanceService.getPaiementByReference(reference);
      return { success: true, data: paiement };
    } catch (error: any) {
      console.error('Erreur lors de la récupération du paiement:', error);
      const errorMsg = error?.message || 'Paiement non trouvé.';
      return { success: false, error: errorMsg };
    }
  };

  const getStudentInfo = async (matricule: string) => {
    try {
      const studentInfo = await FinanceService.getStudentInfo(matricule);
      return { success: true, data: studentInfo };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des infos étudiant:', error);
      const errorMsg = error?.message || 'Étudiant non trouvé.';
      return { success: false, error: errorMsg };
    }
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    paiements,
    meta,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    resetFilters,
    createPaiement,
    getPaiementByReference,
    getStudentInfo,
    refresh: fetchPaiements,
  };
};

export default usePaiementsData;
