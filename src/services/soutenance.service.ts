import httpService from './http.service'

class SoutenanceService {
  // Périodes de soumission - Récupère les années avec leurs périodes
  async getPeriods() {
    const response = await httpService.get('/api/inscription/annees-academiques')
    const periodsResponse = await httpService.get('/api/soutenance/periods')
    const periods = periodsResponse.data.data || periodsResponse.data
    
    const years = (response.data.data || response.data).map((year: any) => ({
      ...year,
      defenseSubmissionPeriods: periods.filter((p: any) => p.academic_year_id === year.id)
    }))
    
    return years
  }

  async createPeriod(yearId: number, data: { start_date: string; end_date: string }) {
    const response = await httpService.post('/api/soutenance/periods', {
      academic_year_id: yearId,
      ...data,
    })
    return response.data
  }

  async updatePeriod(periodId: number, data: { start_date: string; end_date: string }) {
    const response = await httpService.put(`/api/soutenance/periods/${periodId}`, data)
    return response.data
  }

  // Soumissions - retourne les données brutes pour DataTables
  async getSubmissions() {
    const response = await httpService.get('/api/soutenance/submissions/data')
    return response.data
  }

  async acceptSubmission(submissionId: number) {
    const response = await httpService.post('/api/soutenance/submissions/accept', {
      submission_id: submissionId,
    })
    return response.data
  }

  async rejectSubmission(submissionId: number, reason: string) {
    const response = await httpService.post('/api/soutenance/submissions/reject', {
      submission_id: submissionId,
      rejection_reason: reason,
    })
    return response.data
  }

  async getDossierDetails(submissionId: number) {
    const response = await httpService.get(`/api/soutenance/submissions/${submissionId}/dossier`)
    return response.data.data || response.data
  }

  // Jurys - retourne les données brutes pour DataTables
  async getJurySubmissions() {
    const response = await httpService.get('/api/soutenance/jury/data')
    return response.data
  }

  async getJury(submissionId: number) {
    const response = await httpService.get('/api/soutenance/jury/get', {
      params: { submission_id: submissionId },
    })
    return response.data.data || response.data
  }

  async saveJury(submissionId: number, data: any) {
    const response = await httpService.post(`/api/soutenance/submissions/${submissionId}/jury`, data)
    return response.data
  }

  // Note: Les exports ne sont pas encore implémentés dans le backend
  async exportJury(type: 'proposals' | 'notes', yearId: any, defenseType: any) {
    const endpoint =
      type === 'proposals'
        ? '/api/soutenance/jury/export-proposals'
        : '/api/soutenance/jury/export-notes'
    const response = await httpService.get(endpoint, {
      params: { academic_year: yearId, defense_type: defenseType },
      responseType: 'blob',
    })
    return response.data
  }

  // Données de référence
  async getAcademicYears() {
    const response = await httpService.get('/api/inscription/annees-academiques')
    return response.data.data || response.data
  }

  async getDepartments() {
    const response = await httpService.get('/api/inscription/filieres')
    return response.data.data || response.data
  }

  async getProfessors() {
    const response = await httpService.get('/api/rh/professors')
    return response.data.data || response.data
  }

  async getRooms() {
    const response = await httpService.get('/api/emploi-du-temps/rooms')
    return response.data.data || response.data
  }
}

export default new SoutenanceService()
