import { describe, it, expect, vi, beforeEach } from 'vitest'
import InscriptionService from '../inscription.service'
import HttpService from '../http.service'

vi.mock('../http.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    downloadFile: vi.fn(),
  },
}))

describe('InscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('stats', () => {
    it('devrait récupérer les statistiques du dashboard', async () => {
      const mockStats = { total_students: 100, total_pending: 20 }
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockStats })

      const result = await InscriptionService.stats()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/stats')
      expect(result).toEqual(mockStats)
    })
  })

  describe('graphes', () => {
    it('devrait récupérer les données des graphiques', async () => {
      const year = '2024'
      const mockGraphData = { chart1: [], chart2: [] }
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockGraphData })

      const result = await InscriptionService.graphes(year)

      expect(HttpService.get).toHaveBeenCalledWith(`inscription/graphes?year=${year}`)
      expect(result).toEqual(mockGraphData)
    })
  })

  describe('academicYears', () => {
    it('devrait récupérer la liste des années académiques', async () => {
      const mockYears = [{ id: 1, year: '2024-2025' }]
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockYears })

      const result = await InscriptionService.academicYears()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/academic-years')
      expect(result).toEqual(mockYears)
    })
  })

  describe('createAcademicYear', () => {
    it('devrait créer une année académique avec toutes les données', async () => {
      const yearData = {
        year_start: '2024',
        year_end: '2025',
        submission_start: '2024-09-01',
        submission_end: '2024-10-31',
        departments: [1, 2, 3],
      }
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.createAcademicYear(yearData)

      expect(HttpService.post).toHaveBeenCalledWith('inscription/academic-years', yearData)
    })

    it('devrait créer une année académique avec données minimales', async () => {
      const yearData = { year_start: '2024', year_end: '2025' }
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.createAcademicYear(yearData)

      expect(HttpService.post).toHaveBeenCalledWith('inscription/academic-years', yearData)
    })
  })

  describe('updateAcademicYear', () => {
    it('devrait mettre à jour une année académique', async () => {
      const yearId = 1
      const data = { year_start: '2025' }
      vi.mocked(HttpService.put).mockResolvedValue({ success: true })

      await InscriptionService.updateAcademicYear(yearId, data)

      expect(HttpService.put).toHaveBeenCalledWith(
        `inscription/academic-years/${yearId}`,
        data
      )
    })
  })

  describe('deleteAcademicYear', () => {
    it('devrait supprimer une année académique', async () => {
      const yearId = 1
      vi.mocked(HttpService.delete).mockResolvedValue({ success: true })

      await InscriptionService.deleteAcademicYear(yearId)

      expect(HttpService.delete).toHaveBeenCalledWith(`inscription/academic-years/${yearId}`)
    })
  })

  describe('pendingStudents', () => {
    it('devrait récupérer les étudiants en attente sans filtres', async () => {
      const mockResponse = { data: [], meta: { current_page: 1, total: 0 } }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await InscriptionService.pendingStudents()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/pending-students?')
      expect(result).toEqual(mockResponse)
    })

    it('devrait récupérer les étudiants en attente avec filtres', async () => {
      const filters = {
        status: 'pending',
        department_id: 1,
        level: 'L3',
        page: 2,
        per_page: 20,
      }
      const mockResponse = { data: [], meta: {} }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      await InscriptionService.pendingStudents(filters)

      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('inscription/pending-students?')
      )
      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      )
    })
  })

  describe('createPendingStudent', () => {
    it('devrait créer un étudiant en attente', async () => {
      const studentData = { first_name: 'Jean', last_name: 'Dupont' }
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.createPendingStudent(studentData)

      expect(HttpService.post).toHaveBeenCalledWith(
        'inscription/pending-students',
        studentData
      )
    })
  })

  describe('updatePendingStudent', () => {
    it('devrait mettre à jour un étudiant en attente', async () => {
      const studentId = 123
      const data = { first_name: 'Jean' }
      vi.mocked(HttpService.put).mockResolvedValue({ success: true })

      await InscriptionService.updatePendingStudent(studentId, data)

      expect(HttpService.put).toHaveBeenCalledWith(
        `inscription/pending-students/${studentId}`,
        data
      )
    })
  })

  describe('deletePendingStudent', () => {
    it('devrait supprimer un étudiant en attente', async () => {
      const studentId = 123
      vi.mocked(HttpService.delete).mockResolvedValue({ success: true })

      await InscriptionService.deletePendingStudent(studentId)

      expect(HttpService.delete).toHaveBeenCalledWith(
        `inscription/pending-students/${studentId}`
      )
    })
  })

  describe('updateFinancialStatus', () => {
    it('devrait mettre à jour le statut financier', async () => {
      const studentId = 123
      const data = { exonere: 'Oui' as const, sponsorise: 'Non' as const }
      vi.mocked(HttpService.patch).mockResolvedValue({ success: true })

      await InscriptionService.updateFinancialStatus(studentId, data)

      expect(HttpService.patch).toHaveBeenCalledWith(
        `inscription/pending-students/${studentId}/financial-status`,
        data
      )
    })
  })

  describe('studentsList', () => {
    it('devrait récupérer la liste des étudiants avec filtres', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, name: 'Test' }],
          last_page: 5,
          current_page: 1,
          total: 50,
        },
      }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await InscriptionService.studentsList(
        '2024',
        'info',
        'bac',
        'Non',
        'L3',
        1,
        '',
        10
      )

      expect(HttpService.get).toHaveBeenCalled()
      expect(result.data).toEqual(mockResponse.data.data)
      expect(result.totalPages).toEqual(5)
    })

    it('devrait gérer les filtres "all"', async () => {
      const mockResponse = { data: { data: [], last_page: 1, current_page: 1, total: 0 } }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      await InscriptionService.studentsList('all', 'all', 'all', 'all', 'all', 1, '')

      const callArgs = vi.mocked(HttpService.get).mock.calls[0][0]
      expect(callArgs).not.toContain('year=all')
      expect(callArgs).not.toContain('filiere=all')
    })
  })

  describe('exportList', () => {
    it('devrait exporter une liste sans groupe', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })
      vi.mocked(HttpService.downloadFile).mockResolvedValue(mockBlob)

      const result = await InscriptionService.exportList(
        'presence',
        '2024',
        'info',
        'L3'
      )

      expect(HttpService.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('inscription/students/export/presence?')
      )
      expect(result).toEqual(mockBlob)
    })

    it('devrait exporter une liste avec groupe', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })
      vi.mocked(HttpService.downloadFile).mockResolvedValue(mockBlob)

      await InscriptionService.exportList('presence', '2024', 'info', 'L3', 'Groupe A')

      expect(HttpService.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('groupe=Groupe+A')
      )
    })
  })

  describe('getCycles', () => {
    it('devrait récupérer les cycles', async () => {
      const mockCycles = [{ id: 1, name: 'Licence' }]
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockCycles })

      const result = await InscriptionService.getCycles()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/cycles')
      expect(result).toEqual(mockCycles)
    })
  })

  describe('getFilieres', () => {
    it('devrait récupérer les filières', async () => {
      const mockFilieres = [{ id: 1, name: 'Informatique' }]
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockFilieres })

      const result = await InscriptionService.getFilieres()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/filieres')
      expect(result).toEqual(mockFilieres)
    })
  })

  describe('getNiveaux', () => {
    it('devrait récupérer les niveaux', async () => {
      const mockNiveaux = { info: [{ id: 'L1', name: 'L1' }] }
      vi.mocked(HttpService.get).mockResolvedValue({ data: mockNiveaux })

      const result = await InscriptionService.getNiveaux()

      expect(HttpService.get).toHaveBeenCalledWith('inscription/niveaux')
      expect(result).toEqual(mockNiveaux)
    })
  })

  describe('filterOptions', () => {
    it('devrait récupérer toutes les options de filtrage', async () => {
      const mockFilieres = [{ id: 1, name: 'Info' }]
      const mockYears = [{ id: 1, year: '2024-2025' }]
      const mockDiplomas = { data: [{ id: 1, name: 'BAC' }] }
      const mockNiveaux = { info: [{ id: 'L1', name: 'L1' }] }

      vi.mocked(HttpService.get)
        .mockResolvedValueOnce({ data: mockFilieres })
        .mockResolvedValueOnce({ data: mockYears })
        .mockResolvedValueOnce(mockDiplomas)
        .mockResolvedValueOnce({ data: mockNiveaux })

      const result = await InscriptionService.filterOptions()

      expect(result).toHaveProperty('filieres')
      expect(result).toHaveProperty('years')
      expect(result).toHaveProperty('entryDiplomas')
      expect(result).toHaveProperty('statuts')
      expect(result).toHaveProperty('niveaux')
      expect(result.statuts).toHaveLength(3)
    })

    it('devrait retourner des tableaux vides en cas d\'erreur', async () => {
      vi.mocked(HttpService.get).mockRejectedValue(new Error('Network error'))

      const result = await InscriptionService.filterOptions()

      expect(result.filieres).toEqual([])
      expect(result.years).toEqual([])
      expect(result.entryDiplomas).toEqual([])
      expect(result.statuts).toEqual([])
      expect(result.niveaux).toEqual({})
    })
  })

  describe('getClassGroups', () => {
    it('devrait récupérer les groupes d\'une classe', async () => {
      const mockGroups = { data: [{ id: 1, name: 'Groupe A' }] }
      vi.mocked(HttpService.get).mockResolvedValue(mockGroups)

      const result = await InscriptionService.getClassGroups(1, 2, 'L3')

      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('inscription/class-groups?')
      )
      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('academic_year_id=1')
      )
      expect(result).toEqual(mockGroups)
    })
  })

  describe('createClassGroups', () => {
    it('devrait créer des groupes de classe', async () => {
      const groupData = {
        academic_year_id: 1,
        department_id: 2,
        study_level: 'L3',
        replace_existing: true,
        groups: [
          { name: 'Groupe A', student_ids: [1, 2, 3] },
          { name: 'Groupe B', student_ids: [4, 5, 6] },
        ],
      }
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.createClassGroups(groupData)

      expect(HttpService.post).toHaveBeenCalledWith('inscription/class-groups', groupData)
    })
  })

  describe('deleteClassGroup', () => {
    it('devrait supprimer un groupe', async () => {
      const groupId = 123
      vi.mocked(HttpService.delete).mockResolvedValue({ success: true })

      await InscriptionService.deleteClassGroup(groupId)

      expect(HttpService.delete).toHaveBeenCalledWith(`inscription/class-groups/${groupId}`)
    })
  })

  describe('deleteAllClassGroups', () => {
    it('devrait supprimer tous les groupes d\'une classe', async () => {
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.deleteAllClassGroups(1, 2, 'L3')

      expect(HttpService.post).toHaveBeenCalledWith(
        'inscription/class-groups/delete-all',
        {
          academic_year_id: 1,
          department_id: 2,
          study_level: 'L3',
        }
      )
    })
  })

  describe('sendMail', () => {
    it('devrait envoyer un email aux étudiants', async () => {
      const studentsData = [{ id: 1, email: 'test@test.com' }]
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.sendMail(studentsData)

      expect(HttpService.post).toHaveBeenCalledWith('inscription/send-mail', {
        students: studentsData,
      })
    })
  })

  describe('submitDocuments', () => {
    it('devrait soumettre des documents', async () => {
      const documents = [new File(['test'], 'doc.pdf')]
      const documentTypes = ['diplome']
      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await InscriptionService.submitDocuments(123, documents, documentTypes)

      expect(HttpService.post).toHaveBeenCalledWith(
        'inscription/pending-students/123/documents',
        expect.any(FormData)
      )
    })
  })
})
