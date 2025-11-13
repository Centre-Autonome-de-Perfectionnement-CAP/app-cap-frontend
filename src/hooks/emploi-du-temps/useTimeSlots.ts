import { useState, useEffect, useCallback } from 'react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type { TimeSlot, TimeSlotFilters, CreateTimeSlotRequest } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

export const useTimeSlots = (initialFilters?: TimeSlotFilters) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const fetchTimeSlots = useCallback(async (filters?: TimeSlotFilters) => {
    setLoading(true)
    setError(null)
    try {
      const response = await EmploiDuTempsService.getTimeSlots(filters)
      setTimeSlots(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des créneaux')
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les créneaux horaires',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const getTimeSlotsByDay = useCallback(async (day: string) => {
    setLoading(true)
    try {
      const slots = await EmploiDuTempsService.getTimeSlotsByDay(day)
      return slots
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer les créneaux de ce jour',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTimeSlot = useCallback(async (data: CreateTimeSlotRequest) => {
    setLoading(true)
    try {
      const newSlot = await EmploiDuTempsService.createTimeSlot(data)
      setTimeSlots((prev) => [...prev, newSlot].sort((a, b) => a.start_time.localeCompare(b.start_time)))
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Créneau horaire créé avec succès',
        timer: 2000,
      })
      return newSlot
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Erreur lors de la création du créneau',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTimeSlot = useCallback(
    async (id: number, data: Partial<CreateTimeSlotRequest>) => {
      setLoading(true)
      try {
        const updated = await EmploiDuTempsService.updateTimeSlot(id, data)
        setTimeSlots((prev) => prev.map((ts) => (ts.id === id ? updated : ts)))
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Créneau mis à jour avec succès',
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

  const deleteTimeSlot = useCallback(async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer ce créneau horaire ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await EmploiDuTempsService.deleteTimeSlot(id)
        setTimeSlots((prev) => prev.filter((ts) => ts.id !== id))
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: 'Créneau supprimé avec succès',
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
    fetchTimeSlots(initialFilters)
  }, [fetchTimeSlots, initialFilters])

  return {
    timeSlots,
    loading,
    error,
    meta,
    fetchTimeSlots,
    getTimeSlotsByDay,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  }
}
