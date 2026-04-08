// src/services/attestation.service.ts
// Service complet — toutes les méthodes de génération et d'éligibilité

import HttpService from './http.service'

const BASE_URL = 'attestations'

class AttestationService {

  // ── Éligibilité ─────────────────────────────────────────────────────────────

  /** Étudiants éligibles — attestation de passage (décision favorable, pas dernière année) */
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
    const qs = params.toString()
    return HttpService.get(qs ? `${BASE_URL}/eligible/passage?${qs}` : `${BASE_URL}/eligible/passage`)
  }

  /** Alias — cohérence de nommage (passage = success dans proj2) */
  getEligibleForPassage = this.getEligibleForSuccess

  /** Étudiants éligibles — attestation définitive (dernière année du cycle) */
  getEligibleForDefinitive = async (filters: {
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
    const qs = params.toString()
    return HttpService.get(qs ? `${BASE_URL}/eligible/definitive?${qs}` : `${BASE_URL}/eligible/definitive`)
  }

  /** Étudiants éligibles — attestation d'inscription (inscription approuvée) */
  getEligibleForInscription = async (filters: {
    academic_year_id?: number
    department_id?: number
    search?: string
  }) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value.toString())
      }
    })
    const qs = params.toString()
    return HttpService.get(qs ? `${BASE_URL}/eligible/inscription?${qs}` : `${BASE_URL}/eligible/inscription`)
  }

  /** Étudiants éligibles — certificat de classes préparatoires */
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
    const qs = params.toString()
    return HttpService.get(qs ? `${BASE_URL}/eligible/preparatory?${qs}` : `${BASE_URL}/eligible/preparatory`)
  }

  // ── Génération unitaire ─────────────────────────────────────────────────────

  /** Attestation de passage (en cours de cycle, décision favorable) */
  generatePassage = async (studentPendingStudentId: number): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/passage`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId }),
    })
    return result.url
  }

  /** Alias pour la vue AttestationPassage */
  generateSuccess = this.generatePassage

  /** Attestation définitive (fin de cycle) */
  generateDefinitive = async (studentPendingStudentId: number): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/definitive`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId }),
    })
    return result.url
  }

  /** Attestation d'inscription */
  generateInscription = async (studentPendingStudentId: number): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/inscription`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId }),
    })
    return result.url
  }

  /** Certificat de classes préparatoires */
  generatePreparatory = async (studentPendingStudentId: number): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/preparatory`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId }),
    })
    return result.url
  }

  /** Bulletin de notes */
  generateBulletin = async (
    studentPendingStudentId: number,
    academicYearId: number,
  ): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/bulletin`, {
      method: 'POST',
      body: JSON.stringify({
        student_pending_student_id: studentPendingStudentId,
        academic_year_id: academicYearId,
      }),
    })
    return result.url
  }

  /** Attestation de licence */
  generateLicence = async (studentPendingStudentId: number): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/licence`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_id: studentPendingStudentId }),
    })
    return result.url
  }

  // ── Génération multiple ─────────────────────────────────────────────────────

  /** Plusieurs attestations de passage en un seul PDF */
  generateMultiplePassage = async (studentPendingStudentIds: number[]): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/passage/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds }),
    })
    return result.url
  }

  /** Alias passage/success */
  generateMultipleSuccess = this.generateMultiplePassage

  /** Plusieurs attestations définitives en un seul PDF */
  generateMultipleDefinitive = async (studentPendingStudentIds: number[]): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/definitive/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds }),
    })
    return result.url
  }

  /** Plusieurs attestations d'inscription en un seul PDF */
  generateMultipleInscription = async (studentPendingStudentIds: number[]): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/inscription/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds }),
    })
    return result.url
  }

  /** Plusieurs certificats préparatoires en un seul PDF */
  generateMultiplePreparatory = async (studentPendingStudentIds: number[]): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/preparatory/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds }),
    })
    return result.url
  }

  /** Plusieurs bulletins en un seul PDF */
  generateMultipleBulletins = async (
    bulletins: Array<{ student_pending_student_id: number; academic_year_id: number }>,
  ): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/bulletin/multiple`, {
      method: 'POST',
      body: JSON.stringify({ bulletins }),
    })
    return result.url
  }

  /** Plusieurs attestations de licence en un seul PDF */
  generateMultipleLicence = async (studentPendingStudentIds: number[]): Promise<string> => {
    const result = await HttpService.downloadFile(`${BASE_URL}/generate/licence/multiple`, {
      method: 'POST',
      body: JSON.stringify({ student_pending_student_ids: studentPendingStudentIds }),
    })
    return result.url
  }

  // ── Utilitaires étudiant ────────────────────────────────────────────────────

  /** Met à jour le nom et prénom d'un étudiant avant génération */
  updateStudentNames = async (
    studentPendingStudentId: number,
    lastName: string,
    firstNames: string,
  ) => {
    return HttpService.put(`${BASE_URL}/students/${studentPendingStudentId}/names`, {
      last_name: lastName,
      first_names: firstNames,
    })
  }

  /** Récupère l'URL de l'acte de naissance (pour l'aperçu) */
  getBirthCertificate = async (studentPendingStudentId: number) => {
    return HttpService.get(`${BASE_URL}/students/${studentPendingStudentId}/birth-certificate`)
  }
}

export default new AttestationService()
