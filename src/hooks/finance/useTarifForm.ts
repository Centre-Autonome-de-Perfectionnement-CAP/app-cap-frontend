import { useState, useEffect } from 'react'
import financeService from '@/services/finance.service'
import HttpService from '@/services/http.service'

const useTarifForm = () => {
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [loadingYears, setLoadingYears] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)

  const loadAcademicYears = async () => {
    try {
      setLoadingYears(true)
      const response = await HttpService.get('/inscription/academic-years')
      setAcademicYears(response.data || [])
    } catch (error) {
      console.error('Erreur chargement années:', error)
    } finally {
      setLoadingYears(false)
    }
  }

  const loadAvailableClasses = async (academicYearId: number) => {
    if (!academicYearId) {
      setAvailableClasses([])
      return []
    }
    
    try {
      setLoadingClasses(true)
      const response = await financeService.getAvailableClasses(academicYearId)
      const classes = response.data || []
      setAvailableClasses(classes)
      return classes
    } catch (error) {
      console.error('Erreur chargement classes:', error)
      return []
    } finally {
      setLoadingClasses(false)
    }
  }

  useEffect(() => {
    loadAcademicYears()
  }, [])

  return {
    academicYears,
    availableClasses,
    loadingYears,
    loadingClasses,
    loadAvailableClasses,
  }
}

export default useTarifForm
