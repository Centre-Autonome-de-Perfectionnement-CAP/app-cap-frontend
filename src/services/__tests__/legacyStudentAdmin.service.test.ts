import { describe, it, expect, vi, beforeEach } from 'vitest'
import legacyStudentAdminService from '../legacyStudentAdminService'
import HttpService from '../http.service'
import type { LegacyStudentFormData } from '@/types/legacyStudent.types'

vi.mock('../http.service')

describe('legacyStudentAdminService (Tests Développeur 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Récupération & Filtrage (getAll)', () => {
    it('récupère la liste via l\'API réelle si disponible', async () => {
      const mockApiData = {
        data: [
          { id: 1, matricule: '18-001', last_name: 'DOSSA', first_name: 'Jean', status: 'pending', filieres: [] },
        ],
        meta: { total: 1, per_page: 15, current_page: 1, last_page: 1 },
      }
      vi.mocked(HttpService.get).mockResolvedValueOnce(mockApiData)

      const result = await legacyStudentAdminService.getAll({ page: 1, per_page: 15 })

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
      expect(result.data[0].matricule).toBe('18-001')
      expect(HttpService.get).toHaveBeenCalledWith('/admin/legacy-students?page=1&per_page=15')
    })

    it('bascule sur le mock intelligent si l\'API backend n\'est pas encore joignable', async () => {
      vi.mocked(HttpService.get).mockRejectedValueOnce(new Error('Network error (Dev 2 not deployed yet)'))

      const result = await legacyStudentAdminService.getAll({ status: 'pending' })

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.every((s) => s.status === 'pending')).toBe(true)
    })
  })

  describe('2. Récupération des filières disponibles (getAvailableFilieres)', () => {
    it('renvoie la liste des filières actives', async () => {
      const filieres = await legacyStudentAdminService.getAvailableFilieres()
      expect(Array.isArray(filieres)).toBe(true)
      expect(filieres.length).toBeGreaterThan(0)
      expect(filieres[0]).toHaveProperty('name')
      expect(filieres[0]).toHaveProperty('cycle')
    })
  })

  describe('3. Enregistrement direct au Guichet (create)', () => {
    it('crée un étudiant avec filière et statut validé', async () => {
      const newStudentPayload: LegacyStudentFormData = {
        matricule: '17-0999-EPAC',
        last_name: 'KODJO',
        first_name: 'Marc',
        email: 'marc.kodjo@gmail.com',
        phone: '+229 97 12 34 56',
        enrollment_year: 2017,
        department_id: 1, // filière sélectionnée
        notes_admin: 'Inscription directe physique',
      }

      vi.mocked(HttpService.post).mockRejectedValueOnce(new Error('Use fallback'))

      const created = await legacyStudentAdminService.create(newStudentPayload)

      expect(created.matricule).toBe('17-0999-EPAC')
      expect(created.last_name).toBe('KODJO')
      expect(created.status).toBe('validated')
      expect(created.department?.id).toBe(1)
    })
  })

  describe('4. Validation & Rejet unitaire (validate & reject)', () => {
    it('valide un dossier avec mise à jour du statut', async () => {
      vi.mocked(HttpService.patch).mockRejectedValueOnce(new Error('Use fallback'))

      const validated = await legacyStudentAdminService.validate(1)

      expect(validated.status).toBe('validated')
      expect(validated.rejection_reason).toBeNull()
      expect(validated.validated_by).toBeTruthy()
    })

    it('rejette un dossier avec enregistrement du motif obligatoire', async () => {
      vi.mocked(HttpService.patch).mockRejectedValueOnce(new Error('Use fallback'))

      const reason = 'Matricule inexistant dans les archives 2018'
      const rejected = await legacyStudentAdminService.reject(1, reason)

      expect(rejected.status).toBe('rejected')
      expect(rejected.rejection_reason).toBe(reason)
    })
  })

  describe('5. Actions par lot (bulkUpdateStatus)', () => {
    it('valide plusieurs dossiers d\'un seul appel', async () => {
      vi.mocked(HttpService.post).mockRejectedValueOnce(new Error('Use fallback'))

      const success = await legacyStudentAdminService.bulkUpdateStatus([1, 4], 'validated')

      expect(success).toBe(true)
    })

    it('rejette plusieurs dossiers d\'un seul appel avec motif groupé', async () => {
      vi.mocked(HttpService.post).mockRejectedValueOnce(new Error('Use fallback'))

      const success = await legacyStudentAdminService.bulkUpdateStatus([1, 4], 'rejected', 'Rejet global archives')

      expect(success).toBe(true)
    })
  })
})
