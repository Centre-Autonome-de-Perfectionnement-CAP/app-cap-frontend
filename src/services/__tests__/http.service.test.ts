import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { HttpService } from '../http.service'

vi.mock('axios')

describe('HttpService', () => {
  let httpService: HttpService
  let mockAxiosInstance: any

  beforeEach(() => {
    mockAxiosInstance = {
      request: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(() => 1),
        },
        response: {
          use: vi.fn(() => 1),
        },
      },
    }

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)
    httpService = new HttpService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('devrait créer une instance axios avec la bonne configuration', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('/api/'),
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      )
    })
  })

  describe('GET', () => {
    it('devrait effectuer une requête GET', async () => {
      const mockData = { data: { id: 1, name: 'Test' } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockData })

      const result = await httpService.get('/test')

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/test',
        })
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('POST', () => {
    it('devrait effectuer une requête POST avec des données', async () => {
      const postData = { name: 'Test' }
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      const result = await httpService.post('/test', postData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: '/test',
          data: postData,
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('devrait effectuer une requête POST sans données', async () => {
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      await httpService.post('/test')

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: '/test',
        })
      )
    })
  })

  describe('PUT', () => {
    it('devrait effectuer une requête PUT avec des données', async () => {
      const putData = { name: 'Updated' }
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      const result = await httpService.put('/test/1', putData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: '/test/1',
          data: putData,
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PATCH', () => {
    it('devrait effectuer une requête PATCH', async () => {
      const patchData = { status: 'active' }
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      const result = await httpService.patch('/test/1', patchData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'patch',
          url: '/test/1',
          data: patchData,
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DELETE', () => {
    it('devrait effectuer une requête DELETE', async () => {
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      const result = await httpService.delete('/test/1')

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'delete',
          url: '/test/1',
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('devrait effectuer une requête DELETE avec des données', async () => {
      const deleteData = { reason: 'test' }
      const mockResponse = { data: { success: true } }
      mockAxiosInstance.request.mockResolvedValue({ data: mockResponse })

      await httpService.delete('/test/1', deleteData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'delete',
          url: '/test/1',
          data: deleteData,
        })
      )
    })
  })

  describe('downloadFile', () => {
    it('devrait télécharger un fichier en blob', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })
      mockAxiosInstance.get.mockResolvedValue({ data: mockBlob })

      const result = await httpService.downloadFile('/download/test.pdf')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/download/test.pdf', {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      })
      expect(result).toEqual(mockBlob)
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de requête avec message du backend', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Erreur serveur',
            status: 500,
          },
          status: 500,
        },
      }
      mockAxiosInstance.request.mockRejectedValue(mockError)

      await expect(httpService.get('/test')).rejects.toEqual({
        message: 'Erreur serveur',
        status: 500,
      })
    })

    it('devrait gérer les erreurs sans réponse du serveur', async () => {
      const mockError = {
        message: 'Network Error',
      }
      mockAxiosInstance.request.mockRejectedValue(mockError)

      await expect(httpService.get('/test')).rejects.toEqual({
        message: 'Network Error',
        status: undefined,
      })
    })

    it('devrait gérer les erreurs sans message', async () => {
      mockAxiosInstance.request.mockRejectedValue({})

      await expect(httpService.get('/test')).rejects.toEqual({
        message: 'Une erreur est survenue',
        status: undefined,
      })
    })
  })

  describe('Intercepteurs', () => {
    it('devrait permettre d\'ajouter un intercepteur de requête', () => {
      const onFulfilled = vi.fn()
      const onRejected = vi.fn()

      const id = httpService.addRequestInterceptor(onFulfilled, onRejected)

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledWith(
        onFulfilled,
        onRejected
      )
      expect(id).toBe(1)
    })

    it('devrait permettre d\'ajouter un intercepteur de réponse', () => {
      const onFulfilled = vi.fn()
      const onRejected = vi.fn()

      const id = httpService.addResponseInterceptor(onFulfilled, onRejected)

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
        onFulfilled,
        onRejected
      )
      expect(id).toBe(1)
    })
  })
})
