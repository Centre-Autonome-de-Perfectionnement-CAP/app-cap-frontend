import { useState, useEffect } from 'react';
import FinanceService from '../../services/finance.service';
import type { Quittance } from '../../types/finance.types';

const useQuittancesData = (initialFilters: any = {}) => {
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [meta, setMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>(initialFilters);

  const fetchQuittances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await FinanceService.getQuittances(filters);
      setQuittances(response.data || []);
      setMeta(response.meta || null);
    } catch (error: any) {
      console.error('Erreur lors du chargement des quittances:', error);
      setError(error?.message || 'Impossible de charger les quittances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuittances();
  }, [filters]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters((prev: any) => ({ ...prev, page }));
  };

  const validateQuittance = async (id: number | string) => {
    try {
      const response = await FinanceService.validateQuittance(id);
      if (response.success) {
        await fetchQuittances();
        return { success: true };
      } else {
        const errorMsg = response.error || 'Échec de la validation de la quittance.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors de la validation de la quittance:', error);
      const errorMsg = error?.message || 'Une erreur est survenue.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const rejectQuittance = async (id: number | string, motif: string) => {
    try {
      const response = await FinanceService.rejectQuittance(id, motif);
      if (response.success) {
        await fetchQuittances();
        return { success: true };
      } else {
        const errorMsg = response.error || 'Échec du rejet de la quittance.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors du rejet de la quittance:', error);
      const errorMsg = error?.message || 'Une erreur est survenue.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    quittances,
    meta,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    resetFilters,
    validateQuittance,
    rejectQuittance,
    refresh: fetchQuittances,
  };
};

export default useQuittancesData;
