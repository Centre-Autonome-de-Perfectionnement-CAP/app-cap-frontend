import { useState, useEffect } from 'react'
import HttpService from '@/services/http.service'

const useHistorique = () => {
  const [historiqueData, setHistoriqueData] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      // Utiliser l'endpoint des classes disponibles pour les tarifs
      const response = await HttpService.get('finance/tarifs/available-classes')
      
      // Transformer les données pour avoir un format uniforme
      const uniqueClasses = response.data?.reduce((acc: any[], curr: any) => {
        const key = `${curr.academic_year_id}-${curr.department_id}-${curr.study_level}`
        if (!acc.find((c: any) => `${c.academic_year_id}-${c.department_id}-${c.study_level}` === key)) {
          acc.push({
            id: key,
            name: curr.label,
            department: { name: curr.label.split(' - ')[0] },
            academic_year_id: curr.academic_year_id,
            department_id: curr.department_id,
            study_level: curr.study_level,
          })
        }
        return acc
      }, [])
      
      setClasses(uniqueClasses || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des classes:', err)
    }
  }

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const yearsList = []
    for (let i = currentYear - 5; i <= currentYear; i++) {
      yearsList.push(i)
    }
    setYears(yearsList)
  }

  const getHistoriqueByClass = async (classId: string, year?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('class_id', classId)
      if (year) params.append('year', year)
      
      const response = await HttpService.get(`finance/historique/class?${params.toString()}`)
      setHistoriqueData(response.data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'historique')
      console.error('Erreur historique:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStudentFinancialState = async (studentId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await HttpService.get(`finance/historique/student/${studentId}`)
      return response.data
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'état financier')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const exportClassFinancialState = async (classId: string, year?: string) => {
    try {
      const params = new URLSearchParams()
      params.append('class_id', classId)
      if (year) params.append('year', year)
      
      const response = await HttpService.get(`finance/historique/export/class?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `etat_financier_classe_${classId}_${year || 'toutes'}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export')
      throw err
    }
  }

  useEffect(() => {
    fetchClasses()
    generateYears()
  }, [])

  return {
    historiqueData,
    classes,
    years,
    loading,
    error,
    getHistoriqueByClass,
    getStudentFinancialState,
    exportClassFinancialState,
  }
}

export default useHistorique