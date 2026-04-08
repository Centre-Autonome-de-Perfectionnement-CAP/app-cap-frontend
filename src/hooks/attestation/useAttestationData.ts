// src/hooks/attestation/useAttestationData.ts
// Hook générique partagé par toutes les vues d'attestation.
// Prend en charge : passage, définitive, inscription, préparatoire, licence, bulletin.

import { useState, useCallback } from 'react'
import attestationService from '@/services/attestation.service'
import type { EligibleStudent, AttestationFilters } from '@/types/attestation.types'

export type AttestationType =
  | 'passage'
  | 'definitive'
  | 'inscription'
  | 'preparatory'
  | 'licence'
  | 'bulletin'

// ─── Helpers internes ────────────────────────────────────────────────────────

const downloadBlob = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const showSuccess = async (msg: string) => {
  const Swal = (await import('sweetalert2')).default
  Swal.fire({ icon: 'success', title: 'Succès', text: msg, timer: 2000, showConfirmButton: false })
}

const showError = async (msg: string) => {
  const Swal = (await import('sweetalert2')).default
  Swal.fire({ icon: 'error', title: 'Erreur', text: msg })
}

// ─── Hook principal ──────────────────────────────────────────────────────────

const useAttestationData = (type: AttestationType = 'passage') => {
  const [students, setStudents] = useState<EligibleStudent[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── Chargement liste éligibles ─────────────────────────────────────────────

  const loadStudents = useCallback(async (filters: AttestationFilters) => {
    setLoading(true)
    setError(null)
    try {
      let response
      switch (type) {
        case 'passage':
        case 'licence':    // la licence filtre par niveau, mais la liste = passage
          response = await attestationService.getEligibleForSuccess(filters)
          break
        case 'definitive':
          response = await attestationService.getEligibleForDefinitive(filters)
          break
        case 'inscription':
          response = await attestationService.getEligibleForInscription(filters)
          break
        case 'preparatory':
          response = await attestationService.getEligibleForPreparatory(filters)
          break
        default:
          response = await attestationService.getEligibleForSuccess(filters)
      }
      setStudents(response.data.students || [])
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors du chargement des étudiants'
      setError(msg)
      await showError(msg)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [type])

  // ── Génération unitaire ────────────────────────────────────────────────────

  const generateAttestation = useCallback(async (
    studentPendingStudentId: number,
    overrideType?: AttestationType,
  ) => {
    const t = overrideType ?? type
    let url: string
    let filename: string

    switch (t) {
      case 'passage':
        url      = await attestationService.generatePassage(studentPendingStudentId)
        filename = 'attestation-passage.pdf'
        break
      case 'definitive':
        url      = await attestationService.generateDefinitive(studentPendingStudentId)
        filename = 'attestation-definitive.pdf'
        break
      case 'inscription':
        url      = await attestationService.generateInscription(studentPendingStudentId)
        filename = 'attestation-inscription.pdf'
        break
      case 'preparatory':
        url      = await attestationService.generatePreparatory(studentPendingStudentId)
        filename = 'certificat-preparatoire.pdf'
        break
      case 'licence':
        url      = await attestationService.generateLicence(studentPendingStudentId)
        filename = 'attestation-licence.pdf'
        break
      default:
        url      = await attestationService.generatePassage(studentPendingStudentId)
        filename = 'attestation.pdf'
    }

    downloadBlob(url, filename)
    await showSuccess('Le document a été généré avec succès')
  }, [type])

  // ── Génération multiple ────────────────────────────────────────────────────

  const generateMultiple = useCallback(async (
    studentPendingStudentIds: number[],
    overrideType?: AttestationType,
  ): Promise<string> => {
    const t = overrideType ?? type

    switch (t) {
      case 'passage':
        return attestationService.generateMultiplePassage(studentPendingStudentIds)
      case 'definitive':
        return attestationService.generateMultipleDefinitive(studentPendingStudentIds)
      case 'inscription':
        return attestationService.generateMultipleInscription(studentPendingStudentIds)
      case 'preparatory':
        return attestationService.generateMultiplePreparatory(studentPendingStudentIds)
      case 'licence':
        return attestationService.generateMultipleLicence(studentPendingStudentIds)
      default:
        return attestationService.generateMultiplePassage(studentPendingStudentIds)
    }
  }, [type])

  // ── Génération bulletin ────────────────────────────────────────────────────

  const generateBulletin = useCallback(async (
    studentPendingStudentId: number,
    academicYearId: number,
  ) => {
    const url = await attestationService.generateBulletin(studentPendingStudentId, academicYearId)
    downloadBlob(url, 'bulletin.pdf')
    await showSuccess('Le bulletin a été généré avec succès')
  }, [])

  return {
    students,
    loading,
    error,
    loadStudents,
    generateAttestation,
    generateMultiple,
    generateBulletin,
  }
}

export default useAttestationData
