import HttpService from './http.service'
import type { Professor } from '@/types/cours.types'
import type {
  AdminUser,
  RhStats,
  Contrat,
  CreateContratPayload,
  UpdateContratPayload,
  ProfessorProgram,
} from '@/types/rh.types'
import type { ApiResponse } from '@/types'

class RhService {

  // ─── Professors ─────────────────────────────────────────────────────────────

  getProfessors = async (filters: Record<string, unknown> = {}): Promise<ApiResponse<Professor[]>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const url = params.toString() ? `rh/professors?${params.toString()}` : 'rh/professors'
    return HttpService.get<ApiResponse<Professor[]>>(url)
  }

  getGrades = async (): Promise<ApiResponse<any[]>> => {
    return HttpService.get<ApiResponse<any[]>>('rh/grades')
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
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      const response = await HttpService.post<ApiResponse<Professor>>(`rh/professors/${id}`, data)
      return response.data!
    }
    const response = await HttpService.put<ApiResponse<Professor>>(`rh/professors/${id}`, data)
    return response.data!
  }

  deleteProfessor = async (id: number | string): Promise<void> => {
    await HttpService.delete(`rh/professors/${id}`)
  }

  getProfessorPrograms = async (professorId: number | string): Promise<ProfessorProgram[]> => {
    const response = await HttpService.get<ApiResponse<ProfessorProgram[]>>(
      `rh/professors/${professorId}/programs`,
    )
    return response.data || []
  }

  // ─── Admin Users ────────────────────────────────────────────────────────────

  getAdminUsers = async (filters: Record<string, unknown> = {}): Promise<ApiResponse<AdminUser[]>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const url = params.toString() ? `rh/admin-users?${params.toString()}` : 'rh/admin-users'
    return HttpService.get<ApiResponse<AdminUser[]>>(url)
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

  // ─── Statistics ─────────────────────────────────────────────────────────────

  getStatistics = async (): Promise<RhStats> => {
    const response = await HttpService.get<ApiResponse<RhStats>>('rh/admin-users-statistics')
    return response.data!
  }

  // ─── Roles ──────────────────────────────────────────────────────────────────

  getRoles = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/roles')
    return response.data || []
  }

  // ─── Signataires ────────────────────────────────────────────────────────────

  getSignataires = async (): Promise<ApiResponse<any[]>> => {
    return HttpService.get<ApiResponse<any[]>>('rh/signataires')
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

  // ─── Documents ──────────────────────────────────────────────────────────────

  getDocuments = async (categorie?: string): Promise<any[]> => {
    const url      = categorie ? `rh/documents?categorie=${categorie}` : 'rh/documents'
    const response = await HttpService.get<ApiResponse<any[]>>(url)
    return response.data || []
  }

  createDocument = async (formData: FormData): Promise<any> => {
    const response = await HttpService.post<ApiResponse<any>>('rh/documents', formData)
    return response.data!
  }

  updateDocument = async (id: number, data: any): Promise<any> => {
    const response = await HttpService.put<ApiResponse<any>>(`rh/documents/${id}`, data)
    return response.data!
  }

  deleteDocument = async (id: number): Promise<void> => {
    await HttpService.delete(`rh/documents/${id}`)
  }

  // ─── Important Informations ─────────────────────────────────────────────────

  getImportantInformations = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/important-informations')
    return response.data || []
  }

  getImportantInformationsAdmin = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/important-informations/admin')
    return response.data || []
  }

  createImportantInformation = async (data: any): Promise<any> => {
    if (data.file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value as string | Blob)
        }
      })
      const response = await HttpService.post<ApiResponse<any>>('rh/important-informations', formData)
      return response.data!
    }
    const response = await HttpService.post<ApiResponse<any>>('rh/important-informations', data)
    return response.data!
  }

  updateImportantInformation = async (id: number, data: any): Promise<any> => {
    if (data.file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value as string | Blob)
        }
      })
      formData.append('_method', 'PUT')
      const response = await HttpService.post<ApiResponse<any>>(`rh/important-informations/${id}`, formData)
      return response.data!
    }
    const response = await HttpService.put<ApiResponse<any>>(`rh/important-informations/${id}`, data)
    return response.data!
  }

  deleteImportantInformation = async (id: number): Promise<void> => {
    await HttpService.delete(`rh/important-informations/${id}`)
  }

  downloadImportantInformationFile = async (
    fileId: number,
  ): Promise<{ success: true; url: string; filename?: string }> => {
    return HttpService.downloadFile(`rh/files/${fileId}`)
  }

  // ─── Contrats ────────────────────────────────────────────────────────────────

  getContrats = async (): Promise<ApiResponse<Contrat[]>> => {
    return HttpService.get<ApiResponse<Contrat[]>>('rh/contrats')
  }

  getMyContrats = async (): Promise<ApiResponse<Contrat[]>> => {
    return HttpService.get<ApiResponse<Contrat[]>>('rh/professor/my-contrats')
  }

  getContrat = async (id: number | string): Promise<Contrat> => {
    const response = await HttpService.get<ApiResponse<Contrat>>(`rh/contrats/${id}`)
    return response.data!
  }

  getContratByToken = async (token: string): Promise<Contrat> => {
    const response = await HttpService.get<ApiResponse<Contrat>>(
      `rh/contrats/by-token/${token}`,
    )
    return response.data!
  }

  createContrat = async (data: CreateContratPayload): Promise<Contrat> => {
    const response = await HttpService.post<ApiResponse<Contrat>>('rh/contrats', data)
    return response.data!
  }

  updateContrat = async (id: number | string, data: UpdateContratPayload): Promise<Contrat> => {
    const response = await HttpService.put<ApiResponse<Contrat>>(`rh/contrats/${id}`, data)
    return response.data!
  }

  signContrat = async (token: string): Promise<{ success: boolean; message: string }> => {
    return HttpService.post<{ success: boolean; message: string }>(
      `rh/contrats/by-token/${token}/validate`,
      {},
    )
  }

  rejectContrat = async (
    token: string,
    rejectionReason: string,
  ): Promise<{ success: boolean; message: string }> => {
    return HttpService.post<{ success: boolean; message: string }>(
      `rh/contrats/by-token/${token}/reject`,
      { rejection_reason: rejectionReason },
    )
  }

  authorizeContrat = async (id: number | string): Promise<Contrat> => {
    const response = await HttpService.post<ApiResponse<Contrat>>(
      `rh/contrats/${id}/authorize`,
      {},
    )
    return response.data!
  }

  /**
   * Upload du PDF final par l'admin (remplace l'ancien chemin)
   */
  uploadContratPdf = async (
    id: number | string,
    pdfFile: File,
  ): Promise<Contrat> => {
    const formData = new FormData()
    formData.append('pdf_file', pdfFile)
    const response = await HttpService.post<ApiResponse<Contrat>>(
      `rh/contrats/${id}/upload-pdf`,
      formData,
    )
    return response.data!
  }

  deleteContrat = async (id: number | string): Promise<void> => {
    await HttpService.delete(`rh/contrats/${id}`)
  }

  sendTransferEmail = async (
    contratId: number | string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return HttpService.post<ApiResponse<{ message: string }>>(
      `rh/contrats/${contratId}/send-transfer-email`,
      {},
    )
  }

  downloadContratPdf = async (
    idOrToken: number | string,
  ): Promise<{ success: true; url: string; filename?: string }> => {
    return HttpService.downloadFile(`rh/contrats/${idOrToken}/download`)
  }

  // ─── Academic Years ──────────────────────────────────────────────────────────

  getAcademicYears = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/academic-years')
    return response.data || []
  }

  // ─── Cycles ──────────────────────────────────────────────────────────────────

  getCycles = async (): Promise<any[]> => {
    const response = await HttpService.get<ApiResponse<any[]>>('rh/cycles')
    return response.data || []
  }
}

export default new RhService()






