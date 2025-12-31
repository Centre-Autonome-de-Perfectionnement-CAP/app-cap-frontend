import HttpService from './http.service'
import type { Professor } from '@/types/cours.types'
import type { AdminUser, RhStats } from '@/types/rh.types'
import type { ApiResponse } from '@/types'

class RhService {
  // Professors
  getProfessors = async (filters: any = {}): Promise<ApiResponse<Professor[]>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `rh/professors?${params.toString()}`
      : 'rh/professors'
    
    const response = await HttpService.get<ApiResponse<Professor[]>>(url)
    return response
  }

  getGrades = async (): Promise<ApiResponse<any[]>> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/grades')
    return response
  }

  getBanks = async (): Promise<string[]> => {
    const response = await HttpService.get<ApiResponse<string[]>>('rh/banks')
    return response.data || []
  }

  getProfessor = async (id: number | string): Promise<Professor> => {
    const response = await HttpService.get<ApiResponse<Professor>>(`rh/professors/${id}`)
    return response.data!
  }

  createProfessor = async (data: any): Promise<Professor> => {
    const response = await HttpService.post<ApiResponse<Professor>>('rh/professors', data)
    return response.data!
  }

  updateProfessor = async (id: number | string, data: any): Promise<Professor> => {
    const response = await HttpService.put<ApiResponse<Professor>>(`rh/professors/${id}`, data)
    return response.data!
  }

  deleteProfessor = async (id: number | string): Promise<void> => {
    await HttpService.delete(`rh/professors/${id}`)
  }

  // Admin Users
  getAdminUsers = async (filters: any = {}): Promise<ApiResponse<AdminUser[]>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `rh/admin-users?${params.toString()}`
      : 'rh/admin-users'
    
    const response = await HttpService.get<ApiResponse<AdminUser[]>>(url)
    return response
  }

  getAdminUser = async (id: number | string): Promise<AdminUser> => {
    const response = await HttpService.get<ApiResponse<AdminUser>>(`rh/admin-users/${id}`)
    return response.data!
  }

  createAdminUser = async (data: any): Promise<AdminUser> => {
    const response = await HttpService.post<ApiResponse<AdminUser>>('rh/admin-users', data)
    return response.data!
  }

  updateAdminUser = async (id: number | string, data: any): Promise<AdminUser> => {
    const response = await HttpService.put<ApiResponse<AdminUser>>(`rh/admin-users/${id}`, data)
    return response.data!
  }

  deleteAdminUser = async (id: number | string): Promise<void> => {
    await HttpService.delete(`rh/admin-users/${id}`)
  }

  // Statistics
  getStatistics = async (): Promise<RhStats> => {
    const response = await HttpService.get<ApiResponse<RhStats>>('rh/admin-users-statistics')
    return response.data!
  }

  // Roles
  getRoles = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/roles')
    return response.data || []
  }

  // Signataires
  getSignataires = async (): Promise<ApiResponse<any[]>> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/signataires')
    return response
  }

  getSignataire = async (id: number | string): Promise<any> => {
    const response = await HttpService.get<ApiResponse<any>>(`rh/signataires/${id}`)
    return response.data!
  }

  createSignataire = async (data: any): Promise<any> => {
    const response = await HttpService.post<ApiResponse<any>>('rh/signataires', data)
    return response.data!
  }

  updateSignataire = async (id: number | string, data: any): Promise<any> => {
    const response = await HttpService.put<ApiResponse<any>>(`rh/signataires/${id}`, data)
    return response.data!
  }

  deleteSignataire = async (id: number | string): Promise<void> => {
    await HttpService.delete(`rh/signataires/${id}`)
  }

  // Documents Management
  getDocuments = async (categorie?: string): Promise<any[]> => {
    const url = categorie ? `rh/documents?categorie=${categorie}` : 'rh/documents'
    const response = await HttpService.get<ApiResponse<any[]>>(url)
    return response.data || []
  }

  createDocument = async (formData: FormData): Promise<any> => {
    const response = await HttpService.post<ApiResponse<any>>('rh/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data!
  }

  updateDocument = async (id: number, data: any): Promise<any> => {
    const response = await HttpService.put<ApiResponse<any>>(`rh/documents/${id}`, data)
    return response.data!
  }

  deleteDocument = async (id: number): Promise<void> => {
    await HttpService.delete(`rh/documents/${id}`)
  }

  // Important Informations
  getImportantInformations = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/important-informations')
    return response.data || []
  }

  getImportantInformationsAdmin = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/important-informations/admin')
    return response.data || []
  }

  createImportantInformation = async (data: any): Promise<any> => {
    const response = await HttpService.post<ApiResponse<any>>('rh/important-informations', data)
    return response.data!
  }

  updateImportantInformation = async (id: number, data: any): Promise<any> => {
    const response = await HttpService.put<ApiResponse<any>>(`rh/important-informations/${id}`, data)
    return response.data!
  }

  deleteImportantInformation = async (id: number): Promise<void> => {
    await HttpService.delete(`rh/important-informations/${id}`)
  }
}

export default new RhService()
