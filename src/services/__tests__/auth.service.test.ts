import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthService from '../auth.service'
import HttpService from '../http.service'

vi.mock('../http.service', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('devrait effectuer une requête de login avec les credentials', async () => {
      const credentials = { email: 'test@test.com', password: 'password123' }
      const mockResponse = {
        access_token: 'token123',
        token_type: 'Bearer',
        user: { id: 1, name: 'Test User', email: 'test@test.com' },
      }

      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await AuthService.login(credentials)

      expect(HttpService.post).toHaveBeenCalledWith('auth/login', credentials)
      expect(result).toEqual(mockResponse)
    })

    it('devrait propager les erreurs de login', async () => {
      const credentials = { email: 'test@test.com', password: 'wrong' }
      const error = { message: 'Identifiants invalides' }

      vi.mocked(HttpService.post).mockRejectedValue(error)

      await expect(AuthService.login(credentials)).rejects.toEqual(error)
    })
  })

  describe('logout', () => {
    it('devrait effectuer une requête de logout', async () => {
      vi.mocked(HttpService.post).mockResolvedValue(undefined)

      await AuthService.logout()

      expect(HttpService.post).toHaveBeenCalledWith('auth/logout')
    })

    it('devrait gérer les erreurs de logout', async () => {
      const error = { message: 'Erreur réseau' }
      vi.mocked(HttpService.post).mockRejectedValue(error)

      await expect(AuthService.logout()).rejects.toEqual(error)
    })
  })

  describe('forgotPassword', () => {
    it('devrait envoyer une demande de réinitialisation de mot de passe', async () => {
      const payload = { email: 'test@test.com' }
      const mockResponse = { message: 'Email envoyé' }

      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await AuthService.forgotPassword(payload)

      expect(HttpService.post).toHaveBeenCalledWith('auth/password-forgot', payload)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe', async () => {
      const credentials = {
        token: 'reset-token',
        email: 'test@test.com',
        password: 'newpassword',
        password_confirmation: 'newpassword',
      }
      const mockResponse = { message: 'Mot de passe réinitialisé' }

      vi.mocked(HttpService.post).mockResolvedValue(mockResponse)

      const result = await AuthService.resetPassword(credentials)

      expect(HttpService.post).toHaveBeenCalledWith('auth/password-reset', credentials)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getProfile', () => {
    it('devrait récupérer le profil admin', async () => {
      const mockUser = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }

      vi.mocked(HttpService.get).mockResolvedValue(mockUser)

      const result = await AuthService.getProfile('admin')

      expect(HttpService.get).toHaveBeenCalledWith('auth/me')
      expect(result).toEqual(mockUser)
    })

    it('devrait récupérer le profil école', async () => {
      const mockUser = { id: 2, name: 'École', email: 'ecole@test.com', role: 'ecole' }

      vi.mocked(HttpService.get).mockResolvedValue(mockUser)

      const result = await AuthService.getProfile('ecole')

      expect(HttpService.get).toHaveBeenCalledWith('ecole/me')
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateProfile', () => {
    it('devrait mettre à jour le profil utilisateur', async () => {
      const newInfo = { name: 'Updated Name', email: 'updated@test.com' }
      const mockResponse = { id: 1, ...newInfo }

      vi.mocked(HttpService.put).mockResolvedValue(mockResponse)

      const result = await AuthService.updateProfile(newInfo)

      expect(HttpService.put).toHaveBeenCalledWith('auth/update-profile', newInfo)
      expect(result).toEqual(mockResponse)
    })

    it('devrait gérer la mise à jour partielle du profil', async () => {
      const newInfo = { name: 'Only Name Changed' }
      const mockResponse = { id: 1, name: 'Only Name Changed', email: 'old@test.com' }

      vi.mocked(HttpService.put).mockResolvedValue(mockResponse)

      const result = await AuthService.updateProfile(newInfo)

      expect(HttpService.put).toHaveBeenCalledWith('auth/update-profile', newInfo)
      expect(result).toEqual(mockResponse)
    })
  })
})
