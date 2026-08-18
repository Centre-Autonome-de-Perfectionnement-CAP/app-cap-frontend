/**
 * Service API pour le module Gestion des Anciens Étudiants (< 2023)
 * Rôle: Développeur 6
 */

import HttpService from './http.service';
import type {
  LegacyStudent,
  LegacyStudentFormData,
  LegacyStudentFilters,
  LegacyStudentListResponse,
  LegacyStudentStats,
  LegacyFiliere,
} from '@/types/legacyStudent.types';

// Mock initial pour tests et démo immédiate si le backend n'a pas encore le module
let mockLegacyStudents: LegacyStudent[] = [
  {
    id: 1,
    matricule: '18-0452-EPAC',
    last_name: 'DOSSA',
    first_name: 'Jean-Baptiste',
    email: 'jean.dossa@gmail.com',
    phone: '+229 97 22 33 44',
    enrollment_year: 2018,
    filieres: [
      { id: 1, name: 'Génie Civil', abbreviation: 'GC', cycle: 'Licence' },
      { id: 4, name: 'Management des Projets', abbreviation: 'MP', cycle: 'Master' },
    ],
    status: 'pending',
    services_count: 2,
    services_requested: [
      { id: 101, service_name: 'Quitus de Mémoire', requested_at: '2026-08-10', status: 'pending' },
      { id: 102, service_name: 'Attestation de Diplôme', requested_at: '2026-08-12', status: 'in_progress' },
    ],
    created_at: '2026-08-10T10:30:00Z',
  },
  {
    id: 2,
    matricule: '15-0120-CAP',
    last_name: 'HOUNNOU',
    first_name: 'Astride',
    email: 'astride.hounnou@yahoo.fr',
    phone: '+229 96 11 88 77',
    enrollment_year: 2015,
    filieres: [
      { id: 2, name: 'Génie Électrique et Informatique', abbreviation: 'GEI', cycle: 'Licence' },
    ],
    status: 'validated',
    validated_by: 'Secrétariat Scolarité (Mme SOSSOU)',
    validated_at: '2026-08-11T14:20:00Z',
    services_count: 1,
    services_requested: [
      { id: 103, service_name: 'Demande de Bulletin', requested_at: '2026-08-11', status: 'completed' },
    ],
    created_at: '2026-08-11T09:15:00Z',
  },
  {
    id: 3,
    matricule: '20-0899-EPAC',
    last_name: 'ADANHO',
    first_name: 'Gilles',
    email: 'gilles.adanho@gmail.com',
    phone: '+229 95 44 33 22',
    enrollment_year: 2020,
    filieres: [
      { id: 3, name: 'Génie Mécanique et Énergétique', abbreviation: 'GME', cycle: 'Licence' },
    ],
    status: 'rejected',
    rejection_reason: 'Matricule non conforme aux registres de la promotion 2020.',
    validated_by: 'Administration CAP',
    validated_at: '2026-08-12T16:45:00Z',
    services_count: 1,
    created_at: '2026-08-12T11:00:00Z',
  },
  {
    id: 4,
    matricule: '19-0331-EPAC',
    last_name: 'MENSAH',
    first_name: 'Koffi Paul',
    email: 'koffi.mensah@gmail.com',
    phone: '+229 97 55 66 77',
    enrollment_year: 2019,
    filieres: [
      { id: 1, name: 'Génie Civil', abbreviation: 'GC', cycle: 'Licence' },
    ],
    status: 'pending',
    services_count: 1,
    created_at: '2026-08-15T08:20:00Z',
  },
  {
    id: 5,
    matricule: '16-0744-CAP',
    last_name: 'AGBOSSA',
    first_name: 'Sandrine',
    email: 'sandrine.agbossa@gmail.com',
    phone: '+229 94 88 99 00',
    enrollment_year: 2016,
    filieres: [
      { id: 5, name: 'Génie Chimique des Procédés', abbreviation: 'GCP', cycle: 'Licence' },
      { id: 4, name: 'Management des Projets', abbreviation: 'MP', cycle: 'Master' },
    ],
    status: 'validated',
    validated_by: 'Secrétariat Scolarité (Mme SOSSOU)',
    validated_at: '2026-08-16T10:00:00Z',
    services_count: 3,
    created_at: '2026-08-14T15:40:00Z',
  },
];

const mockAvailableFilieres: LegacyFiliere[] = [
  { id: 1, name: 'Génie Civil', abbreviation: 'GC', cycle: 'Licence' },
  { id: 2, name: 'Génie Électrique et Informatique', abbreviation: 'GEI', cycle: 'Licence' },
  { id: 3, name: 'Génie Mécanique et Énergétique', abbreviation: 'GME', cycle: 'Licence' },
  { id: 4, name: 'Management des Projets', abbreviation: 'MP', cycle: 'Master' },
  { id: 5, name: 'Génie Chimique des Procédés', abbreviation: 'GCP', cycle: 'Licence' },
  { id: 6, name: 'Production et Santé Animales', abbreviation: 'PSA', cycle: 'Licence' },
  { id: 7, name: 'Génie Biomédical', abbreviation: 'GBM', cycle: 'Licence' },
];

export const legacyStudentAdminService = {
  /**
   * Récupérer la liste paginée et filtrée des anciens étudiants
   */
  async getAll(filters: LegacyStudentFilters = {}): Promise<LegacyStudentListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.enrollment_year) params.set('year', String(filters.enrollment_year));
      if (filters.department_id) params.set('department_id', String(filters.department_id));
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await HttpService.get<any>(`/admin/legacy-students${qs}`);
      
      if (response && response.data) {
        return {
          success: true,
          data: response.data,
          meta: response.meta || {
            total: response.data.length,
            per_page: filters.per_page || 15,
            current_page: filters.page || 1,
            last_page: 1,
          },
          stats: response.stats,
        };
      }
      throw new Error('Fallback to mock');
    } catch (e) {
      // Fallback Mock si l'API backend n'est pas encore prête
      let filtered = [...mockLegacyStudents];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.matricule.toLowerCase().includes(query) ||
            s.last_name.toLowerCase().includes(query) ||
            s.first_name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone.includes(query)
        );
      }

      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter((s) => s.status === filters.status);
      }

      if (filters.enrollment_year) {
        filtered = filtered.filter((s) => s.enrollment_year === Number(filters.enrollment_year));
      }

      if (filters.department_id) {
        filtered = filtered.filter((s) =>
          s.filieres.some((f) => String(f.id) === String(filters.department_id))
        );
      }

      const total = filtered.length;
      const perPage = filters.per_page || 10;
      const currentPage = filters.page || 1;
      const startIndex = (currentPage - 1) * perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + perPage);

      const stats = {
        total: mockLegacyStudents.length,
        pending: mockLegacyStudents.filter((s) => s.status === 'pending').length,
        validated: mockLegacyStudents.filter((s) => s.status === 'validated').length,
        rejected: mockLegacyStudents.filter((s) => s.status === 'rejected').length,
      };

      return {
        success: true,
        data: paginatedData,
        meta: {
          total,
          per_page: perPage,
          current_page: currentPage,
          last_page: Math.ceil(total / perPage) || 1,
          from: total > 0 ? startIndex + 1 : 0,
          to: Math.min(startIndex + perPage, total),
        },
        stats,
      };
    }
  },

  /**
   * Récupérer les statistiques globales des déclarations
   */
  async getStats(): Promise<LegacyStudentStats> {
    try {
      const response = await HttpService.get<any>('/admin/legacy-students/stats');
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      return {
        total: mockLegacyStudents.length,
        pending: mockLegacyStudents.filter((s) => s.status === 'pending').length,
        validated: mockLegacyStudents.filter((s) => s.status === 'validated').length,
        rejected: mockLegacyStudents.filter((s) => s.status === 'rejected').length,
      };
    }
  },

  /**
   * Récupérer la liste des filières disponibles
   */
  async getAvailableFilieres(): Promise<LegacyFiliere[]> {
    try {
      const response = await HttpService.get<any>('/legacy-students/available-filieres');
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      return mockAvailableFilieres;
    }
  },

  /**
   * Récupérer les détails complets d'un ancien étudiant par ID
   */
  async getById(id: number | string): Promise<LegacyStudent | null> {
    try {
      const response = await HttpService.get<any>(`/admin/legacy-students/${id}`);
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      return mockLegacyStudents.find((s) => String(s.id) === String(id)) || null;
    }
  },

  /**
   * Création manuelle d'un ancien étudiant par la secrétaire (au guichet)
   */
  async create(data: LegacyStudentFormData): Promise<LegacyStudent> {
    try {
      const response = await HttpService.post<any>('/admin/legacy-students', data);
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const filieres = mockAvailableFilieres.filter((f) =>
        data.department_ids.includes(f.id)
      );

      const newStudent: LegacyStudent = {
        id: Date.now(),
        matricule: data.matricule,
        last_name: data.last_name.toUpperCase(),
        first_name: data.first_name,
        email: data.email,
        phone: data.phone,
        enrollment_year: Number(data.enrollment_year),
        filieres,
        status: 'validated', // Créé au guichet = validé d'office par la secrétaire
        notes_admin: data.notes_admin || 'Enregistré directement au guichet',
        validated_by: 'Secrétariat Scolarité (Direct)',
        validated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      mockLegacyStudents.unshift(newStudent);
      return newStudent;
    }
  },

  /**
   * Mise à jour / Rectification manuelle d'un dossier
   */
  async update(id: number | string, data: Partial<LegacyStudentFormData>): Promise<LegacyStudent> {
    try {
      const response = await HttpService.put<any>(`/admin/legacy-students/${id}`, data);
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error('Étudiant introuvable');

      const existing = mockLegacyStudents[index];
      const filieres = data.department_ids
        ? mockAvailableFilieres.filter((f) => data.department_ids!.includes(f.id))
        : existing.filieres;

      const updated: LegacyStudent = {
        ...existing,
        matricule: data.matricule ?? existing.matricule,
        last_name: data.last_name ? data.last_name.toUpperCase() : existing.last_name,
        first_name: data.first_name ?? existing.first_name,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        enrollment_year: data.enrollment_year ? Number(data.enrollment_year) : existing.enrollment_year,
        notes_admin: data.notes_admin ?? existing.notes_admin,
        filieres,
        updated_at: new Date().toISOString(),
      };

      mockLegacyStudents[index] = updated;
      return updated;
    }
  },

  /**
   * Valider un dossier d'ancien étudiant
   */
  async validate(id: number | string): Promise<LegacyStudent> {
    try {
      const response = await HttpService.patch<any>(`/admin/legacy-students/${id}/status`, {
        status: 'validated',
      });
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error('Étudiant introuvable');

      mockLegacyStudents[index] = {
        ...mockLegacyStudents[index],
        status: 'validated',
        rejection_reason: null,
        validated_by: 'Secrétariat Scolarité',
        validated_at: new Date().toISOString(),
      };
      return mockLegacyStudents[index];
    }
  },

  /**
   * Rejeter un dossier avec motif obligatoire
   */
  async reject(id: number | string, reason: string): Promise<LegacyStudent> {
    try {
      const response = await HttpService.patch<any>(`/admin/legacy-students/${id}/status`, {
        status: 'rejected',
        rejection_reason: reason,
      });
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error('Étudiant introuvable');

      mockLegacyStudents[index] = {
        ...mockLegacyStudents[index],
        status: 'rejected',
        rejection_reason: reason,
        validated_by: 'Secrétariat Scolarité',
        validated_at: new Date().toISOString(),
      };
      return mockLegacyStudents[index];
    }
  },

  /**
   * Actions par lot : Valider ou Rejeter plusieurs dossiers d'un coup
   */
  async bulkUpdateStatus(
    ids: (number | string)[],
    status: 'validated' | 'rejected',
    reason?: string
  ): Promise<boolean> {
    try {
      await HttpService.post<any>('/admin/legacy-students/bulk-status', {
        ids,
        status,
        rejection_reason: reason,
      });
      return true;
    } catch {
      mockLegacyStudents = mockLegacyStudents.map((s) => {
        if (ids.map(String).includes(String(s.id))) {
          return {
            ...s,
            status,
            rejection_reason: status === 'rejected' ? reason || 'Rejet groupé' : null,
            validated_by: 'Secrétariat Scolarité (Action groupée)',
            validated_at: new Date().toISOString(),
          };
        }
        return s;
      });
      return true;
    }
  },

  /**
   * Importer un fichier Excel / CSV pour enregistrement massif
   */
  async importExcel(file: File): Promise<{ success: boolean; importedCount: number; errors?: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await HttpService.post<any>('/admin/legacy-students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch {
      // Simulation pour démo/test
      return {
        success: true,
        importedCount: 15,
      };
    }
  },
};

export default legacyStudentAdminService;
