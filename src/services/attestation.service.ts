import HttpService from './http.service'

const BASE_URL = 'attestations'

class AttestationService {
  /**
   * Récupère les étudiants éligibles pour attestation de succès
   */
  getEligibleForSuccess = async (filters: {
    academic_year_id?: number
    department_id?: number
    cohort?: string
    search?: string
  }) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value.toString())
      }
    })
    
    const queryString = params.toString()
    const url = queryString ? `${BASE_URL}/eligible/success?${queryString}` : `${BASE_URL}/eligible/success`
    return await HttpService.get(url)
  }

  /**
   * Récupère les étudiants éligibles pour certificat de classes préparatoires
   */
  getEligibleForPreparatory = async (filters: {
    academic_year_id?: number
    department_id?: number
    cohort?: string
  }) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value.toString())
      }
    })
    
    const queryString = params.toString()
    const url = queryString ? `${BASE_URL}/eligible/preparatory?${queryString}` : `${BASE_URL}/eligible/preparatory`
    return await HttpService.get(url)
  }

  /**
   * Génère une attestation de succès
   */
  generateSuccess = async (studentPendingStudentId: number) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/success`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId })
    })
    return result.url
  }

  /**
   * Génère un certificat de classes préparatoires
   */
  generatePreparatory = async (studentPendingStudentId: number) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/preparatory`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId })
    })
    return result.url
  }

  /**
   * Génère plusieurs certificats de classes préparatoires en un seul PDF
   */
  generateMultiplePreparatory = async (studentPendingStudentIds: number[]) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/preparatory/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds })
    })
    return result.url
  }

  /**
   * Génère plusieurs bulletins en un seul PDF
   */
  generateMultipleBulletins = async (bulletins: Array<{student_pending_student_id: number, academic_year_id: number}>) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/bulletin/multiple`, {
      method: 'POST',
      body: JSON.stringify({ bulletins })
    })
    return result.url
  }

  /**
   * Génère plusieurs attestations de licence en un seul PDF
   */
  generateMultipleLicence = async (studentPendingStudentIds: number[]) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/licence/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds })
    })
    return result.url
  }

  /**
   * Génère un bulletin
   */
  generateBulletin = async (
    studentPendingStudentId: number,
    academicYearId: number
  ) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/bulletin`, {
      method: 'POST',
      body: JSON.stringify({
        student_pending_student_id: studentPendingStudentId,
        academic_year_id: academicYearId
      })
    })
    return result.url
  }

  /**
   * Génère une attestation de licence
   */
  generateLicence = async (studentPendingStudentId: number) => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/licence`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId })
    })
    return result.url
  }

  /**
   * Met à jour les noms d'un étudiant
   */
  updateStudentNames = async (
    studentPendingStudentId: number,
    lastName: string,
    firstNames: string
  ) => {
    return await HttpService.put(`${BASE_URL}/students/${studentPendingStudentId}/names`, {
      last_name: lastName,
      first_names: firstNames,
    })
  }

  /**
   * Récupère l'URL de l'acte de naissance
   */
  getBirthCertificate = async (studentPendingStudentId: number) => {
    return await HttpService.get(`${BASE_URL}/students/${studentPendingStudentId}/birth-certificate`)
  }
}

export default new AttestationService()
