import { useState, useCallback } from 'react'
import attestationService from '@/services/attestation.service'
import type { EligibleStudent, AttestationFilters } from '@/types/attestation.types'

const useAttestationData = (type: 'success' | 'preparatory' = 'success') => {
  const [students, setStudents] = useState<EligibleStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStudents = useCallback(async (filters: AttestationFilters) => {
    setLoading(true)
    setError(null)
    try {
      const response = type === 'preparatory'
        ? await attestationService.getEligibleForPreparatory(filters)
        : await attestationService.getEligibleForSuccess(filters)
      setStudents(response.data.students || [])
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors du chargement des étudiants'
      setError(errorMsg)
      alert(errorMsg)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [type])

  const generateAttestation = useCallback(async (
    studentPendingStudentId: number,
    attestationType: 'success' | 'preparatory' | 'licence'
  ) => {
    try {
      let url: string
      let filename: string
      switch (attestationType) {
        case 'preparatory':
          url = await attestationService.generatePreparatory(studentPendingStudentId)
          filename = 'certificat-preparatoire.pdf'
          break
        case 'licence':
          url = await attestationService.generateLicence(studentPendingStudentId)
          filename = 'attestation-licence.pdf'
          break
        default:
          url = await attestationService.generateSuccess(studentPendingStudentId)
          filename = 'attestation-succes.pdf'
      }
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Le document a été généré avec succès',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la génération'
      })
      throw err
    }
  }, [])

  const generateBulletin = useCallback(async (
    studentPendingStudentId: number,
    academicYearId: number
  ) => {
    try {
      const url = await attestationService.generateBulletin(
        studentPendingStudentId,
        academicYearId
      )
      
      const link = document.createElement('a')
      link.href = url
      link.download = 'bulletin.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Le bulletin a été généré avec succès',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la génération'
      })
      throw err
    }
  }, [])

  return {
    students,
    loading,
    error,
    loadStudents,
    generateAttestation,
    generateBulletin,
  }
}

export default useAttestationData
