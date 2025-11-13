import { useState, useEffect, useCallback } from 'react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type { Room, RoomFilters, CreateRoomRequest } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

export const useRooms = (initialFilters?: RoomFilters) => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const fetchRooms = useCallback(async (filters?: RoomFilters) => {
    setLoading(true)
    setError(null)
    try {
      const response = await EmploiDuTempsService.getRooms(filters)
      setRooms(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des salles')
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les salles',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const getAvailableRooms = useCallback(
    async (timeSlotId: number, date: string, minCapacity?: number) => {
      setLoading(true)
      try {
        const available = await EmploiDuTempsService.getAvailableRooms({
          time_slot_id: timeSlotId,
          date,
          min_capacity: minCapacity,
        })
        return available
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de récupérer les salles disponibles',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createRoom = useCallback(async (data: CreateRoomRequest) => {
    setLoading(true)
    try {
      const newRoom = await EmploiDuTempsService.createRoom(data)
      setRooms((prev) => [newRoom, ...prev])
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Salle créée avec succès',
        timer: 2000,
      })
      return newRoom
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Erreur lors de la création de la salle',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateRoom = useCallback(async (id: number, data: Partial<CreateRoomRequest>) => {
    setLoading(true)
    try {
      const updated = await EmploiDuTempsService.updateRoom(id, data)
      setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)))
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Salle mise à jour avec succès',
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
  }, [])

  const deleteRoom = useCallback(async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer cette salle ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await EmploiDuTempsService.deleteRoom(id)
        setRooms((prev) => prev.filter((r) => r.id !== id))
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: 'Salle supprimée avec succès',
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
    fetchRooms(initialFilters)
  }, [fetchRooms, initialFilters])

  return {
    rooms,
    loading,
    error,
    meta,
    fetchRooms,
    getAvailableRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  }
}
