import { useState, useEffect } from 'react';
import FinanceService from '../../services/finance.service';
import type { TarifScolarite } from '../../types/finance.types';

const useTarifsData = () => {
  const [tarifs, setTarifs] = useState<TarifScolarite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTarifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await FinanceService.getTarifs();
      const tarifsList = Array.isArray(response.data) ? response.data : (response.data || []);
      setTarifs(tarifsList);
    } catch (error: any) {
      console.error('Erreur lors du chargement des tarifs:', error);
      setError(error?.message || 'Impossible de charger les tarifs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarifs();
  }, []);

  const createTarif = async (data: any) => {
    try {
      const response = await FinanceService.createTarif(data);
      if (response.success) {
        await fetchTarifs();
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error || 'Échec de la création du tarif.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du tarif:', error);
      const errorMsg = error?.message || 'Une erreur est survenue.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const updateTarif = async (id: number | string, data: any) => {
    try {
      const response = await FinanceService.updateTarif(id, data);
      if (response.success) {
        await fetchTarifs();
        return { success: true };
      } else {
        const errorMsg = response.error || 'Échec de la mise à jour du tarif.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du tarif:', error);
      const errorMsg = error?.message || 'Une erreur est survenue.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const deleteTarif = async (id: number | string) => {
    try {
      const response = await FinanceService.deleteTarif(id);
      if (response.success) {
        await fetchTarifs();
        return { success: true };
      } else {
        const errorMsg = response.error || 'Échec de la suppression du tarif.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression du tarif:', error);
      const errorMsg = error?.message || 'Une erreur est survenue.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return {
    tarifs,
    loading,
    error,
    createTarif,
    updateTarif,
    deleteTarif,
    refresh: fetchTarifs,
  };
};

export default useTarifsData;
