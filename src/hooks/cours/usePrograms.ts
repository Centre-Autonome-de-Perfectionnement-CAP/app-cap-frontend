import { useState, useEffect, useCallback } from 'react'
import CoursService from '@/services/cours.service'
import type {
  Program,
  CourseElement,
  Professor,
  ClassGroup,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramFilters,
  PaginatedResponse
} from '@/types/cours.types'

export const usePrograms = (initialFilters: ProgramFilters = {}) => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [courseElements, setCourseElements] = useState<CourseElement[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
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
  const [filters, setFilters] = useState<ProgramFilters>(initialFilters)

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response: PaginatedResponse<Program> = await CoursService.getPrograms(filters)
      
      setPrograms(response.data)
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des programmes')
      console.error('Erreur fetchPrograms:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchReferenceData = useCallback(async () => {
    try {
      const [courseElementsResponse, professorsResponse, classGroupsResponse] = await Promise.all([
        CoursService.getCourseElements({ per_page: 100 }),
        CoursService.getProfessors(),
        CoursService.getClassGroups()
      ])
      
      setCourseElements(courseElementsResponse.data)
      setProfessors(professorsResponse)
      setClassGroups(classGroupsResponse)
    } catch (err: any) {
      console.error('Erreur fetchReferenceData:', err)
    }
  }, [])

  const createProgram = useCallback(async (data: CreateProgramRequest): Promise<Program | null> => {
    try {
      const newProgram = await CoursService.createProgram(data)
      await fetchPrograms() // Refresh the list
      return newProgram
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création du programme')
      console.error('Erreur createProgram:', err)
      throw err
    }
  }, [fetchPrograms])

  const updateProgram = useCallback(async (id: number | string, data: UpdateProgramRequest): Promise<Program | null> => {
    try {
      const updatedProgram = await CoursService.updateProgram(id, data)
      await fetchPrograms() // Refresh the list
      return updatedProgram
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour du programme')
      console.error('Erreur updateProgram:', err)
      throw err
    }
  }, [fetchPrograms])

  const deleteProgram = useCallback(async (id: number | string): Promise<void> => {
    try {
      await CoursService.deleteProgram(id)
      await fetchPrograms() // Refresh the list
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la suppression du programme')
      console.error('Erreur deleteProgram:', err)
      throw err
    }
  }, [fetchPrograms])

  const updateFilters = useCallback((newFilters: ProgramFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const goToPage = useCallback((page: number) => {
    updateFilters({ per_page: filters.per_page || 15 })
  }, [filters.per_page, updateFilters])

  const validateWeighting = useCallback((weighting: { [key: string]: number }) => {
    const total = Object.values(weighting).reduce((sum, value) => sum + value, 0)
    return total === 100
  }, [])

  const getTotalWeighting = useCallback((weighting: { [key: string]: number }) => {
    return Object.values(weighting).reduce((sum, value) => sum + value, 0)
  }, [])

  const renderWeightingBadges = useCallback((weighting: { [key: string]: number }) => {
    return Object.entries(weighting)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({ key, value, label: `${key}: ${value}%` }))
  }, [])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  return {
    // Data
    programs,
    courseElements,
    professors,
    classGroups,
    pagination,
    loading,
    error,
    filters,
    
    // Actions
    createProgram,
    updateProgram,
    deleteProgram,
    fetchPrograms,
    fetchReferenceData,
    updateFilters,
    resetFilters,
    goToPage,
    
    // Utils
    setError,
    validateWeighting,
    getTotalWeighting,
    renderWeightingBadges
  }
}

export default usePrograms
