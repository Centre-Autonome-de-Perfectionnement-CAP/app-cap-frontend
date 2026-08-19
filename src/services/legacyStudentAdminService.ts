/**
 * Service API pour le module Gestion des Anciens Étudiants (< 2023)
 * Gère les enregistrements et l'ensemble des services étudiants rétroactifs.
 */

import HttpService from './http.service';
import type {
  LegacyStudent,
  LegacyStudentFormData,
  LegacyStudentFilters,
  LegacyStudentListResponse,
  LegacyStudentStats,
  LegacyFiliere,
  LegacyStudentServiceRequest,
  LegacyServiceFilters,
  LegacyServicesListResponse,
  LegacyServiceStatus,
  AcademicRecord,
} from '@/types/legacyStudent.types';

// Mock initial de secours si le backend est temporairement déconnecté
let mockLegacyStudents: LegacyStudent[] = [
  {
    id: 1,
    matricule: '18-0452-EPAC',
    last_name: 'DOSSA',
    first_name: 'Jean-Baptiste',
    email: 'jean.dossa@gmail.com',
    phone: '+229 97 22 33 44',
    enrollment_year: 2018,
    department: { id: 1, name: 'Génie Civil', abbreviation: 'GC', cycle: 'Licence' },
    status: 'pending',
    services_count: 2,
    services_requested: [
      {
        id: 101,
        legacy_student_id: 1,
        matricule: '18-0452-EPAC',
        student_name: 'DOSSA Jean-Baptiste',
        email: 'jean.dossa@gmail.com',
        phone: '+229 97 22 33 44',
        service_type: 'quitus_memoire',
        service_name: 'Quitus de Mémoire de Soutenance',
        filiere_name: 'Génie Civil',
        enrollment_year: 2018,
        requested_at: '2026-08-10',
        status: 'pending',
      },
      {
        id: 102,
        legacy_student_id: 1,
        matricule: '18-0452-EPAC',
        student_name: 'DOSSA Jean-Baptiste',
        email: 'jean.dossa@gmail.com',
        phone: '+229 97 22 33 44',
        service_type: 'attestation_diplome',
        service_name: 'Attestation de Diplôme (Rétroactive)',
        filiere_name: 'Génie Civil',
        enrollment_year: 2018,
        requested_at: '2026-08-12',
        status: 'in_progress',
      },
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
    department: { id: 2, name: 'Génie Électrique et Informatique', abbreviation: 'GEI', cycle: 'Licence' },
    status: 'validated',
    validated_by: 'Secrétariat Scolarité (Mme SOSSOU)',
    validated_at: '2026-08-11T14:20:00Z',
    services_count: 1,
    services_requested: [
      {
        id: 103,
        legacy_student_id: 2,
        matricule: '15-0120-CAP',
        student_name: 'HOUNNOU Astride',
        email: 'astride.hounnou@yahoo.fr',
        phone: '+229 96 11 88 77',
        service_type: 'demande_bulletin',
        service_name: 'Demande de Relevé de Notes / Bulletin',
        filiere_name: 'Génie Électrique et Informatique',
        enrollment_year: 2015,
        requested_at: '2026-08-11',
        status: 'delivered',
        processed_by: 'Scolarité CAP',
      },
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
    department: { id: 3, name: 'Génie Mécanique et Énergétique', abbreviation: 'GME', cycle: 'Licence' },
    status: 'rejected',
    rejection_reason: 'Matricule non conforme aux registres de la promotion 2020.',
    validated_by: 'Administration CAP',
    validated_at: '2026-08-12T16:45:00Z',
    services_count: 1,
    services_requested: [
      {
        id: 104,
        legacy_student_id: 3,
        matricule: '20-0899-EPAC',
        student_name: 'ADANHO Gilles',
        email: 'gilles.adanho@gmail.com',
        phone: '+229 95 44 33 22',
        service_type: 'correction_memoire',
        service_name: 'Dépôt Mémoire Après Correction',
        filiere_name: 'Génie Mécanique et Énergétique',
        enrollment_year: 2020,
        requested_at: '2026-08-12',
        status: 'rejected',
        rejection_reason: 'Dossier académique non validé.',
      },
    ],
    created_at: '2026-08-12T11:00:00Z',
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
      if (filters.enrollment_year) params.set('enrollment_year', String(filters.enrollment_year));
      if (filters.department_id) params.set('department_id', String(filters.department_id));
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await HttpService.get<any>(`admin/legacy-students${qs}`);

      if (response && response.data) {
        return {
          success: true,
          data: response.data,
          meta: {
            total: response.total ?? response.data.length,
            per_page: response.per_page ?? filters.per_page ?? 10,
            current_page: response.current_page ?? filters.page ?? 1,
            last_page: response.last_page ?? 1,
            from: 1,
            to: response.data.length,
          },
          stats: response.stats,
        };
      }
      throw new Error('Fallback to mock');
    } catch {
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
          String(s.department?.id) === String(filters.department_id)
        );
      }

      const total = filtered.length;
      const perPage = filters.per_page || 10;
      const currentPage = filters.page || 1;
      const startIndex = (currentPage - 1) * perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + perPage);

      const allServices = mockLegacyStudents.flatMap((s) => s.services_requested || []);
      const stats: LegacyStudentStats = {
        total: mockLegacyStudents.length,
        pending: mockLegacyStudents.filter((s) => s.status === 'pending').length,
        validated: mockLegacyStudents.filter((s) => s.status === 'validated').length,
        rejected: mockLegacyStudents.filter((s) => s.status === 'rejected').length,
        services_total: allServices.length,
        services_pending: allServices.filter((srv) => srv.status === 'pending').length,
        services_delivered: allServices.filter((srv) => srv.status === 'delivered').length,
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
   * Récupérer toutes les demandes de services étudiants faites par des anciens étudiants (< 2023)
   */
  async getServices(filters: LegacyServiceFilters = {}): Promise<LegacyServicesListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.service_type && filters.service_type !== 'all') params.set('service_type', filters.service_type);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await HttpService.get<any>(`admin/legacy-students/services${qs}`);
      if (response && response.data) {
        return {
          success: true,
          data: response.data,
          meta: {
            total: response.data.length,
            per_page: 50,
            current_page: 1,
            last_page: 1,
          },
        };
      }
      throw new Error('Fallback to mock');
    } catch {
      let allServices = mockLegacyStudents.flatMap((s) => s.services_requested || []);

      if (filters.search) {
        const query = filters.search.toLowerCase();
        allServices = allServices.filter(
          (srv) =>
            srv.service_name.toLowerCase().includes(query) ||
            (srv.matricule && srv.matricule.toLowerCase().includes(query)) ||
            (srv.student_name && srv.student_name.toLowerCase().includes(query))
        );
      }

      if (filters.service_type && filters.service_type !== 'all') {
        allServices = allServices.filter((srv) => srv.service_type === filters.service_type);
      }

      if (filters.status && filters.status !== 'all') {
        allServices = allServices.filter((srv) => srv.status === filters.status);
      }

      const total = allServices.length;
      const perPage = filters.per_page || 10;
      const currentPage = filters.page || 1;
      const startIndex = (currentPage - 1) * perPage;
      const paginatedData = allServices.slice(startIndex, startIndex + perPage);

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
      };
    }
  },

  /**
   * Mettre à jour le statut d'une demande de service d'un ancien étudiant
   */
  async updateServiceStatus(
    serviceId: number | string,
    status: LegacyServiceStatus,
    notes?: string,
    rejection_reason?: string
  ): Promise<boolean> {
    try {
      await HttpService.patch<any>(`admin/legacy-students/services/${serviceId}/status`, {
        status,
        notes,
        reason: rejection_reason,
      });
      return true;
    } catch {
      mockLegacyStudents.forEach((student) => {
        if (student.services_requested) {
          student.services_requested = student.services_requested.map((srv) => {
            if (String(srv.id) === String(serviceId)) {
              return {
                ...srv,
                status,
                notes: notes || srv.notes,
                rejection_reason: rejection_reason || null,
                processed_at: new Date().toISOString(),
                processed_by: 'Scolarité CAP',
              };
            }
            return srv;
          });
        }
      });
      return true;
    }
  },

  /**
   * Récupérer les statistiques globales
   */
  async getStats(): Promise<LegacyStudentStats> {
    try {
      const response = await this.getAll({ per_page: 1 });
      if (response && response.stats) return response.stats;
      throw new Error('Fallback to mock');
    } catch {
      const allServices = mockLegacyStudents.flatMap((s) => s.services_requested || []);
      return {
        total: mockLegacyStudents.length,
        pending: mockLegacyStudents.filter((s) => s.status === 'pending').length,
        validated: mockLegacyStudents.filter((s) => s.status === 'validated').length,
        rejected: mockLegacyStudents.filter((s) => s.status === 'rejected').length,
        services_total: allServices.length,
        services_pending: allServices.filter((srv) => srv.status === 'pending').length,
        services_delivered: allServices.filter((srv) => srv.status === 'delivered').length,
      };
    }
  },

  /**
   * Récupérer la liste des filières disponibles
   */
  async getAvailableFilieres(): Promise<LegacyFiliere[]> {
    try {
      const response = await HttpService.get<any>('legacy-students/available-filieres');
      const filieres = Array.isArray(response) ? response : response?.data;
      if (Array.isArray(filieres) && filieres.length > 0) return filieres;
      throw new Error('Fallback to mock');
    } catch {
      return mockAvailableFilieres;
    }
  },

  /**
   * Récupérer les détails d'un ancien étudiant par ID
   */
  async getById(id: number | string): Promise<LegacyStudent | null> {
    try {
      const response = await HttpService.get<any>(`admin/legacy-students/${id}`);
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      return mockLegacyStudents.find((s) => String(s.id) === String(id)) || null;
    }
  },

  /**
   * Création manuelle au guichet
   */
  async create(data: LegacyStudentFormData): Promise<LegacyStudent> {
    try {
      const response = await HttpService.post<any>('admin/legacy-students', data);
      if (response) return response.data || response;
      throw new Error('Fallback to mock');
    } catch {
      const department = mockAvailableFilieres.find((f) => String(f.id) === String(data.department_id)) || null;

      const newStudent: LegacyStudent = {
        id: Date.now(),
        matricule: data.matricule,
        last_name: data.last_name.toUpperCase(),
        first_name: data.first_name,
        date_of_birth: data.date_of_birth || null,
        place_of_birth: data.place_of_birth || null,
        cycle: data.cycle || null,
        email: data.email,
        phone: data.phone,
        enrollment_year: Number(data.enrollment_year),
        department,
        status: 'validated',
        notes_admin: data.notes_admin || 'Enregistré directement au guichet',
        validated_by: 'Secrétariat Scolarité (Direct)',
        validated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        services_count: 0,
        services_requested: [],
      };

      mockLegacyStudents.unshift(newStudent);
      return newStudent;
    }
  },

  /**
   * Mise à jour manuelle d'un dossier
   */
  async update(id: number | string, data: Partial<LegacyStudentFormData>): Promise<LegacyStudent> {
    try {
      const response = await HttpService.put<any>(`admin/legacy-students/${id}`, data);
      if (response) return response.data || response;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index === -1) throw new Error('Étudiant introuvable');

      const existing = mockLegacyStudents[index];
      const department = data.department_id !== undefined
        ? mockAvailableFilieres.find((f) => String(f.id) === String(data.department_id)) || null
        : existing.department;

      const updated: LegacyStudent = {
        ...existing,
        matricule: data.matricule ?? existing.matricule,
        last_name: data.last_name ? data.last_name.toUpperCase() : existing.last_name,
        first_name: data.first_name ?? existing.first_name,
        date_of_birth: data.date_of_birth ?? existing.date_of_birth,
        place_of_birth: data.place_of_birth ?? existing.place_of_birth,
        cycle: data.cycle !== undefined ? (data.cycle || null) : existing.cycle,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        enrollment_year: data.enrollment_year ? Number(data.enrollment_year) : existing.enrollment_year,
        notes_admin: data.notes_admin ?? existing.notes_admin,
        department,
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
      const response = await HttpService.post<any>(`admin/legacy-students/${id}/validate`);
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index !== -1) {
        mockLegacyStudents[index] = {
          ...mockLegacyStudents[index],
          status: 'validated',
          validated_by: 'Secrétariat Scolarité',
          validated_at: new Date().toISOString(),
          rejection_reason: null,
        };
        return mockLegacyStudents[index];
      }
      throw new Error('Étudiant introuvable');
    }
  },

  /**
   * Rejeter un dossier d'ancien étudiant avec motif
   */
  async reject(id: number | string, reason: string): Promise<LegacyStudent> {
    try {
      const response = await HttpService.post<any>(`admin/legacy-students/${id}/reject`, { reason });
      if (response && response.data) return response.data;
      throw new Error('Fallback to mock');
    } catch {
      const index = mockLegacyStudents.findIndex((s) => String(s.id) === String(id));
      if (index !== -1) {
        mockLegacyStudents[index] = {
          ...mockLegacyStudents[index],
          status: 'rejected',
          rejection_reason: reason,
          validated_by: null,
          validated_at: null,
        };
        return mockLegacyStudents[index];
      }
      throw new Error('Étudiant introuvable');
    }
  },

  /**
   * Validation en masse
   */
  async bulkValidate(ids: (number | string)[]): Promise<boolean> {
    try {
      await HttpService.post<any>('admin/legacy-students/bulk-validate', { ids });
      return true;
    } catch {
      mockLegacyStudents.forEach((student) => {
        if (ids.map(String).includes(String(student.id))) {
          student.status = 'validated';
          student.validated_by = 'Secrétariat Scolarité';
          student.validated_at = new Date().toISOString();
          student.rejection_reason = null;
        }
      });
      return true;
    }
  },

  /**
   * Rejet en masse
   */
  async bulkReject(ids: (number | string)[], reason: string): Promise<boolean> {
    try {
      await HttpService.post<any>('admin/legacy-students/bulk-reject', { ids, reason });
      return true;
    } catch {
      mockLegacyStudents.forEach((student) => {
        if (ids.map(String).includes(String(student.id))) {
          student.status = 'rejected';
          student.rejection_reason = reason;
          student.validated_by = null;
          student.validated_at = null;
        }
      });
      return true;
    }
  },

  /**
   * Validation / rejet en masse avec statut générique
   */
  async bulkUpdateStatus(
    ids: (number | string)[],
    status: 'validated' | 'rejected',
    reason?: string
  ): Promise<boolean> {
    if (status === 'validated') {
      return legacyStudentAdminService.bulkValidate(ids);
    }
    return legacyStudentAdminService.bulkReject(ids, reason || '');
  },

  /**
   * Import depuis un fichier Excel
   */
  async importExcel(file: File): Promise<{ success: boolean; importedCount?: number }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await HttpService.post<any>('admin/legacy-students/import', formData);
      return { success: true, importedCount: response?.imported_count };
    } catch {
      return { success: false };
    }
  },

  // ── Dossier académique rétroactif ─────────────────────────────────────────

  /**
   * Récupère tous les relevés académiques d'un ancien étudiant
   */
  async getAcademicRecords(studentId: number | string): Promise<AcademicRecord[]> {
    try {
      const response = await HttpService.get<any>(`admin/legacy-students/${studentId}/academic-records`);
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Crée un nouveau relevé académique
   */
  async saveAcademicRecord(
    studentId: number | string,
    payload: Partial<AcademicRecord>
  ): Promise<AcademicRecord> {
    const response = await HttpService.post<any>(
      `admin/legacy-students/${studentId}/academic-records`,
      payload
    );
    return response?.data ?? response;
  },

  /**
   * Met à jour un relevé académique existant
   */
  async updateAcademicRecord(
    studentId: number | string,
    recordId: number | string,
    payload: Partial<AcademicRecord>
  ): Promise<AcademicRecord> {
    const response = await HttpService.put<any>(
      `admin/legacy-students/${studentId}/academic-records/${recordId}`,
      payload
    );
    return response?.data ?? response;
  },

  /**
   * Supprime un relevé académique
   */
  async deleteAcademicRecord(
    studentId: number | string,
    recordId: number | string
  ): Promise<void> {
    await HttpService.delete<any>(
      `admin/legacy-students/${studentId}/academic-records/${recordId}`
    );
  },
};

export default legacyStudentAdminService;

