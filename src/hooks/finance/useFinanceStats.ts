import { useState, useEffect } from 'react';
import FinanceService from '../../services/finance.service';
import type { StatistiquesFinance } from '../../types/finance.types';

const useFinanceStats = (initialFilters: any = {}) => {
  const [stats, setStats] = useState<StatistiquesFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>(initialFilters);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await FinanceService.getStatistics(filters);
      setStats(response.data || response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setError(error?.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    stats,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchStats,
  };
};

export default useFinanceStats;
