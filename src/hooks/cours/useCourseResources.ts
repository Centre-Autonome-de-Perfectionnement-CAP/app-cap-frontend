import { useState, useEffect, useCallback } from 'react'
import CoursService from '@/services/cours.service'
import type {
  CourseResource,
  CourseElement,
  CreateCourseResourceRequest,
  UpdateCourseResourceRequest,
  CourseResourceFilters,
  PaginatedResponse
} from '@/types/cours.types'

export const useCourseResources = (initialFilters: CourseResourceFilters = {}) => {
  const [courseResources, setCourseResources] = useState<CourseResource[]>([])
  const [courseElements, setCourseElements] = useState<CourseElement[]>([])
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
  const [filters, setFilters] = useState<CourseResourceFilters>(initialFilters)

  const fetchCourseResources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response: PaginatedResponse<CourseResource> = await CoursService.getCourseResources(filters)
      
      setCourseResources(response.data)
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des ressources')
      console.error('Erreur fetchCourseResources:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchCourseElements = useCallback(async () => {
    try {
      const response = await CoursService.getCourseElements({ per_page: 100 }) // Get all for select options
      setCourseElements(response.data)
    } catch (err: any) {
      console.error('Erreur fetchCourseElements:', err)
    }
  }, [])

  const createCourseResource = useCallback(async (data: CreateCourseResourceRequest): Promise<CourseResource | null> => {
    try {
      const newResource = await CoursService.createCourseResource(data)
      await fetchCourseResources() // Refresh the list
      return newResource
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création de la ressource')
      console.error('Erreur createCourseResource:', err)
      throw err
    }
  }, [fetchCourseResources])

  const updateCourseResource = useCallback(async (id: number | string, data: UpdateCourseResourceRequest): Promise<CourseResource | null> => {
    try {
      const updatedResource = await CoursService.updateCourseResource(id, data)
      await fetchCourseResources() // Refresh the list
      return updatedResource
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour de la ressource')
      console.error('Erreur updateCourseResource:', err)
      throw err
    }
  }, [fetchCourseResources])

  const deleteCourseResource = useCallback(async (id: number | string): Promise<void> => {
    try {
      await CoursService.deleteCourseResource(id)
      await fetchCourseResources() // Refresh the list
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la suppression de la ressource')
      console.error('Erreur deleteCourseResource:', err)
      throw err
    }
  }, [fetchCourseResources])

  const updateFilters = useCallback((newFilters: CourseResourceFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const goToPage = useCallback((page: number) => {
    updateFilters({ per_page: filters.per_page || 15 })
  }, [filters.per_page, updateFilters])

  const resourceTypes = [
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'cours', label: 'Cours' },
    { value: 'td', label: 'TD' },
    { value: 'tp', label: 'TP' },
    { value: 'examen', label: 'Examen' },
  ]

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'syllabus': return 'primary'
      case 'cours': return 'success'
      case 'td': return 'info'
      case 'tp': return 'warning'
      case 'examen': return 'danger'
      default: return 'secondary'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  useEffect(() => {
    fetchCourseResources()
  }, [fetchCourseResources])

  useEffect(() => {
    fetchCourseElements()
  }, [fetchCourseElements])

  return {
    // Data
    courseResources,
    courseElements,
    pagination,
    loading,
    error,
    filters,
    resourceTypes,
    
    // Actions
    createCourseResource,
    updateCourseResource,
    deleteCourseResource,
    fetchCourseResources,
    fetchCourseElements,
    updateFilters,
    resetFilters,
    goToPage,
    
    // Utils
    setError,
    getResourceTypeColor,
    formatFileSize
  }
}

export default useCourseResources
