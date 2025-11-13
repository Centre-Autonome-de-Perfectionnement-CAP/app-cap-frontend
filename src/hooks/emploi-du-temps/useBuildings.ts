import { useState, useEffect, useCallback } from 'react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type { Building, BuildingFilters, CreateBuildingRequest } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

export const useBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const fetchBuildings = useCallback(async (filters?: BuildingFilters) => {
    setLoading(true)
    setError(null)
    try {
      const response = await EmploiDuTempsService.getBuildings(filters)
      setBuildings(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des bâtiments')
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les bâtiments',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const createBuilding = useCallback(async (data: CreateBuildingRequest) => {
    setLoading(true)
    try {
      const newBuilding = await EmploiDuTempsService.createBuilding(data)
      setBuildings((prev) => [newBuilding, ...prev])
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Bâtiment créé avec succès',
        timer: 2000,
      })
      return newBuilding
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Erreur lors de la création du bâtiment',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBuilding = useCallback(
    async (id: number, data: Partial<CreateBuildingRequest>) => {
      setLoading(true)
      try {
        const updated = await EmploiDuTempsService.updateBuilding(id, data)
        setBuildings((prev) => prev.map((b) => (b.id === id ? updated : b)))
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Bâtiment mis à jour avec succès',
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

  const deleteBuilding = useCallback(async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer ce bâtiment ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await EmploiDuTempsService.deleteBuilding(id)
        setBuildings((prev) => prev.filter((b) => b.id !== id))
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: 'Bâtiment supprimé avec succès',
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
    fetchBuildings()
  }, [fetchBuildings])

  return {
    buildings,
    loading,
    error,
    meta,
    fetchBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  }
}
