import { useState, useEffect, useCallback } from 'react'
import CoursService from '@/services/cours.service'
import type {
  TeachingUnit,
  CreateTeachingUnitRequest,
  UpdateTeachingUnitRequest,
  TeachingUnitFilters,
  PaginatedResponse
} from '@/types/cours.types'

export const useTeachingUnits = (initialFilters: TeachingUnitFilters = {}) => {
  const [teachingUnits, setTeachingUnits] = useState<TeachingUnit[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TeachingUnitFilters>(initialFilters)

  const fetchTeachingUnits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response: PaginatedResponse<TeachingUnit> = await CoursService.getTeachingUnits(filters)
      
      setTeachingUnits(response.data)
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des unités d\'enseignement')
      console.error('Erreur fetchTeachingUnits:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createTeachingUnit = useCallback(async (data: CreateTeachingUnitRequest): Promise<TeachingUnit | null> => {
    try {
      const newUnit = await CoursService.createTeachingUnit(data)
      await fetchTeachingUnits() // Refresh the list
      return newUnit
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création de l\'UE')
      console.error('Erreur createTeachingUnit:', err)
      throw err
    }
  }, [fetchTeachingUnits])

  const updateTeachingUnit = useCallback(async (id: number | string, data: UpdateTeachingUnitRequest): Promise<TeachingUnit | null> => {
    try {
      const updatedUnit = await CoursService.updateTeachingUnit(id, data)
      await fetchTeachingUnits() // Refresh the list
      return updatedUnit
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour de l\'UE')
      console.error('Erreur updateTeachingUnit:', err)
      throw err
    }
  }, [fetchTeachingUnits])

  const deleteTeachingUnit = useCallback(async (id: number | string): Promise<void> => {
    try {
      await CoursService.deleteTeachingUnit(id)
      await fetchTeachingUnits() // Refresh the list
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la suppression de l\'UE')
      console.error('Erreur deleteTeachingUnit:', err)
      throw err
    }
  }, [fetchTeachingUnits])

  const updateFilters = useCallback((newFilters: TeachingUnitFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const goToPage = useCallback((page: number) => {
    updateFilters({ per_page: filters.per_page || 15 })
    // Note: The pagination is typically handled by the backend via per_page parameter
  }, [filters.per_page, updateFilters])

  useEffect(() => {
    fetchTeachingUnits()
  }, [fetchTeachingUnits])

  return {
    // Data
    teachingUnits,
    pagination,
    loading,
    error,
    filters,
    
    // Actions
    createTeachingUnit,
    updateTeachingUnit,
    deleteTeachingUnit,
    fetchTeachingUnits,
    updateFilters,
    resetFilters,
    goToPage,
    
    // Utils
    setError
  }
}

export default useTeachingUnits
