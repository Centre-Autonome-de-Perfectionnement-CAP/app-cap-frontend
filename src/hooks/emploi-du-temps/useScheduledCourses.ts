import { useState, useEffect, useCallback } from 'react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type {
  ScheduledCourse,
  ScheduledCourseFilters,
  CreateScheduledCourseRequest,
  ConflictCheckRequest,
  ConflictCheckResponse,
} from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

export const useScheduledCourses = (initialFilters?: ScheduledCourseFilters) => {
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const fetchScheduledCourses = useCallback(async (filters?: ScheduledCourseFilters) => {
    setLoading(true)
    setError(null)
    try {
      const response = await EmploiDuTempsService.getScheduledCourses(filters)
      setScheduledCourses(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des cours')
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les cours planifiés',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const checkConflicts = useCallback(async (data: ConflictCheckRequest): Promise<ConflictCheckResponse | null> => {
    setLoading(true)
    try {
      const result = await EmploiDuTempsService.checkConflicts(data)
      
      if (result.has_conflicts && result.conflicts && result.conflicts.length > 0) {
        // Afficher les conflits à l'utilisateur
        const conflictMessages = result.conflicts.map((c) => `• ${c.message}`).join('<br>')
        
        await Swal.fire({
          icon: 'warning',
          title: 'Conflits détectés',
          html: `<div style="text-align: left;">Les conflits suivants ont été détectés :<br><br>${conflictMessages}</div>`,
          confirmButtonText: 'Compris',
        })
      }
      
      return result
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de vérifier les conflits',
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createScheduledCourse = useCallback(
    async (data: CreateScheduledCourseRequest, skipConflictCheck = false) => {
      // Vérifier les conflits d'abord
      if (!skipConflictCheck) {
        const conflictResult = await checkConflicts({
          program_id: data.program_id,
          time_slot_id: data.time_slot_id,
          room_id: data.room_id,
          start_date: data.start_date,
          is_recurring: data.is_recurring,
          recurrence_end_date: data.recurrence_end_date,
        })

        if (conflictResult?.has_conflicts) {
          const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Continuer malgré les conflits ?',
            text: 'Des conflits ont été détectés. Voulez-vous quand même créer ce cours ?',
            showCancelButton: true,
            confirmButtonText: 'Oui, créer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33',
          })

          if (!confirm.isConfirmed) {
            return null
          }
        }
      }

      setLoading(true)
      try {
        const newCourse = await EmploiDuTempsService.createScheduledCourse(data)
        setScheduledCourses((prev) => [newCourse, ...prev])
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Cours planifié créé avec succès',
          timer: 2000,
        })
        return newCourse
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Erreur lors de la création du cours',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [checkConflicts]
  )

  const updateScheduledCourse = useCallback(
    async (id: number, data: Partial<CreateScheduledCourseRequest>) => {
      setLoading(true)
      try {
        const updated = await EmploiDuTempsService.updateScheduledCourse(id, data)
        setScheduledCourses((prev) => prev.map((sc) => (sc.id === id ? updated : sc)))
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Cours mis à jour avec succès',
          timer: 2000,
        })
        return updated
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Erreur lors de la mise à jour',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const cancelCourse = useCallback(async (id: number, notes?: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Annuler ce cours ?',
      text: 'Cette action peut être inversée plus tard',
      input: 'textarea',
      inputPlaceholder: 'Raison de l\'annulation (optionnel)',
      inputValue: notes || '',
      showCancelButton: true,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const updated = await EmploiDuTempsService.cancelScheduledCourse(id, result.value)
        setScheduledCourses((prev) => prev.map((sc) => (sc.id === id ? updated : sc)))
        Swal.fire({
          icon: 'success',
          title: 'Cours annulé',
          text: 'Le cours a été annulé avec succès',
          timer: 2000,
        })
        return updated
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de l\'annulation du cours',
        })
        throw err
      } finally {
        setLoading(false)
      }
    }
  }, [])

  const updateCompletedHours = useCallback(async (id: number, hours: number) => {
    setLoading(true)
    try {
      const updated = await EmploiDuTempsService.updateCompletedHours(id, hours)
      setScheduledCourses((prev) => prev.map((sc) => (sc.id === id ? updated : sc)))
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Heures effectuées mises à jour',
        timer: 2000,
      })
      return updated
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour des heures',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excludeDate = useCallback(async (id: number, date: string) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Exclure cette date ?',
      text: `Le cours du ${new Date(date).toLocaleDateString('fr-FR')} sera exclu`,
      showCancelButton: true,
      confirmButtonText: 'Oui, exclure',
      cancelButtonText: 'Annuler',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const updated = await EmploiDuTempsService.excludeDate(id, date)
        setScheduledCourses((prev) => prev.map((sc) => (sc.id === id ? updated : sc)))
        Swal.fire({
          icon: 'success',
          title: 'Date exclue',
          text: 'La date a été exclue avec succès',
          timer: 2000,
        })
        return updated
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de l\'exclusion de la date',
        })
        throw err
      } finally {
        setLoading(false)
      }
    }
  }, [])

  const deleteCourse = useCallback(async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer ce cours planifié ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await EmploiDuTempsService.deleteScheduledCourse(id)
        setScheduledCourses((prev) => prev.filter((sc) => sc.id !== id))
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: 'Cours supprimé avec succès',
          timer: 2000,
        })
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Erreur lors de la suppression',
        })
        throw err
      } finally {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchScheduledCourses(initialFilters)
  }, [fetchScheduledCourses, initialFilters])

  return {
    scheduledCourses,
    loading,
    error,
    meta,
    fetchScheduledCourses,
    checkConflicts,
    createScheduledCourse,
    updateScheduledCourse,
    cancelCourse,
    updateCompletedHours,
    excludeDate,
    deleteCourse,
  }
}
