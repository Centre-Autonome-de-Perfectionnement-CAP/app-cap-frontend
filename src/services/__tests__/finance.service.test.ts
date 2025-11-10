import { describe, it, expect, vi, beforeEach } from 'vitest'
import FinanceService from '../finance.service'
import HttpService from '../http.service'

vi.mock('../http.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('FinanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPaiements', () => {
    it('devrait récupérer la liste des paiements sans filtres', async () => {
      const mockResponse = {
        data: [],
        meta: { current_page: 1, total: 0 },
      }

      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getPaiements()

      expect(HttpService.get).toHaveBeenCalledWith('finance/paiements?')
      expect(result).toEqual(mockResponse)
    })

    it('devrait récupérer la liste des paiements avec filtres', async () => {
      const filters = {
        status: 'approved',
        page: 2,
        per_page: 20,
      }
      const mockResponse = {
        data: [{ id: 1, reference: 'REF001' }],
        meta: { current_page: 2, total: 50 },
      }

      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getPaiements(filters)

      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('finance/paiements?')
      )
      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=approved')
      )
      expect(result).toEqual(mockResponse)
    })

    it('devrait ignorer les filtres vides', async () => {
      const filters = {
        status: '',
        page: null,
        per_page: undefined,
      }

      vi.mocked(HttpService.get).mockResolvedValue({ data: [], meta: {} })

      await FinanceService.getPaiements(filters as any)

      expect(HttpService.get).toHaveBeenCalledWith('finance/paiements?')
    })
  })

  describe('createPaiement', () => {
    it('devrait créer un nouveau paiement', async () => {
      const paiementData = {
        matricule: 'MAT001',
        montant: 50000,
        reference: 'REF001',
        numero_compte: '123456',
        date_versement: '2024-01-15',
        quittance: new File([''], 'quittance.pdf'),
        motif: 'Inscription',
        email: 'test@test.com',
        contact: '0601020304',
      }

      const mockResponse = { success: true, data: { id: 1 } }
      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await FinanceService.createPaiement(paiementData)

      expect(HttpService.post).toHaveBeenCalledWith(
        'finance/paiements',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })

    it('devrait créer un paiement sans email et contact', async () => {
      const paiementData = {
        matricule: 'MAT001',
        montant: 50000,
        reference: 'REF001',
        numero_compte: '123456',
        date_versement: '2024-01-15',
        quittance: new File([''], 'quittance.pdf'),
        motif: 'Inscription',
      }

      vi.mocked(HttpService.post).mockResolvedValue({ success: true })

      await FinanceService.createPaiement(paiementData)

      expect(HttpService.post).toHaveBeenCalled()
    })
  })

  describe('getPaiementByReference', () => {
    it('devrait récupérer un paiement par sa référence', async () => {
      const reference = 'REF001'
      const mockPaiement = { id: 1, reference: 'REF001', montant: 50000 }
      const mockResponse = { data: mockPaiement }

      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getPaiementByReference(reference)

      expect(HttpService.get).toHaveBeenCalledWith(`finance/paiements/${reference}`)
      expect(result).toEqual(mockPaiement)
    })
  })

  describe('getStudentInfo', () => {
    it('devrait récupérer les informations d\'un étudiant', async () => {
      const matricule = 'MAT001'
      const mockStudent = { 
        matricule: 'MAT001', 
        nom: 'Dupont', 
        prenom: 'Jean',
        niveau: 'L3'
      }
      const mockResponse = { data: mockStudent }

      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getStudentInfo(matricule)

      expect(HttpService.get).toHaveBeenCalledWith(`finance/paiements/student/${matricule}`)
      expect(result).toEqual(mockStudent)
    })
  })

  describe('getQuittances', () => {
    it('devrait récupérer la liste des quittances', async () => {
      const mockResponse = { data: [] }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getQuittances()

      expect(HttpService.get).toHaveBeenCalledWith('finance/quittances?')
      expect(result).toEqual(mockResponse)
    })

    it('devrait récupérer les quittances avec filtres', async () => {
      const filters = { status: 'pending', year: 2024 }
      vi.mocked(HttpService.get).mockResolvedValue({ data: [] })

      await FinanceService.getQuittances(filters)

      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('finance/quittances?')
      )
    })
  })

  describe('validateQuittance', () => {
    it('devrait valider une quittance', async () => {
      const quittanceId = 123
      const mockResponse = { success: true }
      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await FinanceService.validateQuittance(quittanceId)

      expect(HttpService.post).toHaveBeenCalledWith(
        `finance/quittances/${quittanceId}/validate`,
        {}
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('rejectQuittance', () => {
    it('devrait rejeter une quittance avec un motif', async () => {
      const quittanceId = 123
      const motif = 'Document illisible'
      const mockResponse = { success: true }
      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await FinanceService.rejectQuittance(quittanceId, motif)

      expect(HttpService.post).toHaveBeenCalledWith(
        `finance/quittances/${quittanceId}/reject`,
        { motif }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getTarifs', () => {
    it('devrait récupérer la liste des tarifs', async () => {
      const mockResponse = { data: [] }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getTarifs()

      expect(HttpService.get).toHaveBeenCalledWith('finance/tarifs')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createTarif', () => {
    it('devrait créer un nouveau tarif', async () => {
      const tarifData = { niveau: 'L3', montant: 50000 }
      const mockResponse = { success: true, data: { id: 1 } }
      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await FinanceService.createTarif(tarifData)

      expect(HttpService.post).toHaveBeenCalledWith('finance/tarifs', tarifData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateTarif', () => {
    it('devrait mettre à jour un tarif', async () => {
      const tarifId = 123
      const tarifData = { montant: 60000 }
      const mockResponse = { success: true }
      vi.mocked(HttpService.put).mockResolvedValue(mockResponse)

      const result = await FinanceService.updateTarif(tarifId, tarifData)

      expect(HttpService.put).toHaveBeenCalledWith(
        `finance/tarifs/${tarifId}`,
        tarifData
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteTarif', () => {
    it('devrait supprimer un tarif', async () => {
      const tarifId = 123
      const mockResponse = { success: true }
      vi.mocked(HttpService.delete).mockResolvedValue(mockResponse)

      const result = await FinanceService.deleteTarif(tarifId)

      expect(HttpService.delete).toHaveBeenCalledWith(`finance/tarifs/${tarifId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCompteEtudiant', () => {
    it('devrait récupérer le compte d\'un étudiant', async () => {
      const etudiantId = 456
      const mockResponse = { data: { solde: 150000 } }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getCompteEtudiant(etudiantId)

      expect(HttpService.get).toHaveBeenCalledWith(`finance/compte/${etudiantId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getStatistics', () => {
    it('devrait récupérer les statistiques financières', async () => {
      const mockResponse = { data: { total_recettes: 1000000 } }
      vi.mocked(HttpService.get).mockResolvedValue(mockResponse)

      const result = await FinanceService.getStatistics()

      expect(HttpService.get).toHaveBeenCalledWith('finance/statistics?')
      expect(result).toEqual(mockResponse)
    })

    it('devrait récupérer les statistiques avec filtres', async () => {
      const filters = { year: 2024, month: 1 }
      vi.mocked(HttpService.get).mockResolvedValue({ data: {} })

      await FinanceService.getStatistics(filters)

      expect(HttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('finance/statistics?')
      )
    })
  })
})
