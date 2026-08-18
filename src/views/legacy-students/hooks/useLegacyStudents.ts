/**
 * Custom Hook React pour la gestion des Anciens Étudiants (< 2023)
 * Rôle: Développeur 6
 */

import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import legacyStudentAdminService from '@/services/legacyStudentAdminService';
import { exportLegacyStudentsToCSV } from '../utils/exportExcel';
import { generateLegacyStudentPdf } from '../utils/generateLegacyStudentPdf';
import type {
  LegacyStudent,
  LegacyStudentFilters,
  LegacyStudentStats,
  LegacyStudentPaginationMeta,
  LegacyFiliere,
  LegacyStudentFormData,
} from '@/types/legacyStudent.types';

export function useLegacyStudents() {
  const [students, setStudents] = useState<LegacyStudent[]>([]);
  const [stats, setStats] = useState<LegacyStudentStats>({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
  });
  const [filieres, setFilieres] = useState<LegacyFiliere[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<LegacyStudentFilters>({
    search: '',
    status: 'all',
    enrollment_year: '',
    department_id: '',
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = useState<LegacyStudentPaginationMeta>({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  // 1. Charger les filières disponibles au montage
  useEffect(() => {
    legacyStudentAdminService.getAvailableFilieres().then((res) => {
      setFilieres(res);
    });
  }, []);

  // 2. Charger les étudiants et statistiques
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await legacyStudentAdminService.getAll(filters);
      if (response.success) {
        setStudents(response.data);
        setPagination(response.meta);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des anciens étudiants:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer la liste des anciens étudiants.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 3. Validation d'un dossier
  const handleValidate = async (id: number | string) => {
    const result = await Swal.fire({
      title: 'Valider ce dossier ?',
      text: 'Le matricule et les filières de cet ancien étudiant seront confirmés officiellement.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2eb85c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await legacyStudentAdminService.validate(id);
        Swal.fire({
          icon: 'success',
          title: 'Dossier validé !',
          text: "L'ancien étudiant a été validé avec succès.",
          timer: 2000,
          showConfirmButton: false,
        });
        await fetchStudents();
      } catch (e: any) {
        Swal.fire('Erreur', e.message || 'Échec de la validation', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 4. Rejet d'un dossier avec saisie de motif obligatoire
  const handleReject = async (id: number | string, prefilledReason?: string) => {
    let reason = prefilledReason;
    if (!reason) {
      const result = await Swal.fire({
        title: 'Rejeter cette déclaration',
        input: 'textarea',
        inputLabel: 'Motif du rejet (obligatoire) :',
        inputPlaceholder: 'Ex: Matricule non trouvé dans les archives physiques de la promotion...',
        inputAttributes: {
          'aria-label': 'Saisissez la raison du rejet',
        },
        showCancelButton: true,
        confirmButtonColor: '#e55353',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Confirmer le rejet',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return 'Vous devez impérativement spécifier un motif de rejet !';
          }
          return null;
        },
      });
      reason = result.value;
    }

    if (reason) {
      setLoading(true);
      try {
        await legacyStudentAdminService.reject(id, reason);
        Swal.fire({
          icon: 'warning',
          title: 'Dossier rejeté',
          text: 'Le dossier a été marqué comme rejeté avec le motif spécifié.',
          timer: 2000,
          showConfirmButton: false,
        });
        await fetchStudents();
      } catch (e: any) {
        Swal.fire('Erreur', e.message || 'Échec du rejet', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 5. Actions par lot : Valider la sélection
  const handleBulkValidate = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: `Valider les ${selectedIds.length} dossiers sélectionnés ?`,
      text: 'Ces anciens étudiants seront tous marqués comme validés.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2eb85c',
      cancelButtonColor: '#d33',
      confirmButtonText: `Oui, valider (${selectedIds.length})`,
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await legacyStudentAdminService.bulkUpdateStatus(selectedIds, 'validated');
        setSelectedIds([]);
        Swal.fire('Succès !', 'Les dossiers sélectionnés ont été validés.', 'success');
        await fetchStudents();
      } catch (e: any) {
        Swal.fire('Erreur', e.message || 'Échec de la validation groupée', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 6. Actions par lot : Rejeter la sélection
  const handleBulkReject = async (prefilledReason?: string) => {
    if (selectedIds.length === 0) return;

    let reason = prefilledReason;
    if (!reason) {
      const result = await Swal.fire({
        title: `Rejeter les ${selectedIds.length} dossiers sélectionnés`,
        input: 'textarea',
        inputLabel: 'Motif global de rejet :',
        inputPlaceholder: 'Ex: Vérification négative des archives papier...',
        showCancelButton: true,
        confirmButtonColor: '#e55353',
        confirmButtonText: 'Rejeter la sélection',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return 'Un motif est requis pour le rejet groupé.';
          }
          return null;
        },
      });
      reason = result.value;
    }

    if (reason) {
      setLoading(true);
      try {
        await legacyStudentAdminService.bulkUpdateStatus(selectedIds, 'rejected', reason);
        setSelectedIds([]);
        Swal.fire('Dossiers rejetés', 'Les dossiers ont été rejetés.', 'warning');
        await fetchStudents();
      } catch (e: any) {
        Swal.fire('Erreur', e.message || 'Échec du rejet groupé', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 7. Enregistrement direct au guichet (Création manuelle)
  const handleCreate = async (data: LegacyStudentFormData) => {
    setLoading(true);
    try {
      await legacyStudentAdminService.create(data);
      Swal.fire({
        icon: 'success',
        title: 'Étudiant Enregistré !',
        text: "L'ancien étudiant a été ajouté et validé au guichet avec succès.",
      });
      await fetchStudents();
      return true;
    } catch (e: any) {
      Swal.fire('Erreur', e.message || "Échec de l'enregistrement", 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 8. Mise à jour / Rectification
  const handleUpdate = async (id: number | string, data: Partial<LegacyStudentFormData>) => {
    setLoading(true);
    try {
      await legacyStudentAdminService.update(id, data);
      Swal.fire({
        icon: 'success',
        title: 'Dossier Mis à Jour !',
        text: 'Les informations ont été rectifiées avec succès.',
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchStudents();
      return true;
    } catch (e: any) {
      Swal.fire('Erreur', e.message || 'Échec de la mise à jour', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 9. Export Excel / CSV
  const handleExport = () => {
    try {
      exportLegacyStudentsToCSV(students, `anciens_etudiants_cap_${Date.now()}.csv`);
      Swal.fire({
        icon: 'success',
        title: 'Export Réussi !',
        text: 'Le fichier CSV/Excel a été téléchargé.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire('Attention', e.message || 'Aucune donnée à exporter.', 'info');
    }
  };

  // 10. Génération et Impression de la fiche PDF
  const handlePrintPdf = (student: LegacyStudent) => {
    try {
      generateLegacyStudentPdf(student);
    } catch (e: any) {
      Swal.fire('Erreur', 'Impossible de générer le PDF : ' + e.message, 'error');
    }
  };

  // 11. Gestion de la sélection par case à cocher
  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: number | string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return {
    students,
    stats,
    filieres,
    loading,
    filters,
    setFilters,
    pagination,
    selectedIds,
    fetchStudents,
    handleValidate,
    handleReject,
    handleBulkValidate,
    handleBulkReject,
    handleCreate,
    handleUpdate,
    handleExport,
    handlePrintPdf,
    toggleSelectAll,
    toggleSelectOne,
  };
}
