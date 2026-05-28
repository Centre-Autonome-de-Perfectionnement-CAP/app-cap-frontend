import { useState, useEffect } from 'react'
import CoursService from '@/services/cours.service'
import type { CourseElementProfessor, CourseElement, Professor } from '@/types/cours.types'

export const useCourseElementProfessors = () => {
  const [assignments, setAssignments] = useState<CourseElementProfessor[]>([])
  const [courseElements, setCourseElements] = useState<CourseElement[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [classGroups, setClassGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await CoursService.getCourseElementProfessorAssignments(filters)
      setAssignments(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des associations')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseElements = async () => {
    try {
      const response = await CoursService.getCourseElements()
      setCourseElements(response.data || [])
    } catch (err: any) {
      console.error('Erreur chargement ECUE:', err)
    }
  }

  const loadProfessors = async () => {
    try {
      const professors = await CoursService.getProfessors()
      setProfessors(professors)
    } catch (err: any) {
      console.error('Erreur chargement professeurs:', err)
    }
  }

  const loadAcademicYears = async () => {
    try {
      const years = await CoursService.getAcademicYears()
      setAcademicYears(years)
    } catch (err: any) {
      console.error('Erreur chargement années:', err)
    }
  }

  const loadClassGroups = async () => {
    try {
      const groups = await CoursService.getClassGroups()
      setClassGroups(groups)
    } catch (err: any) {
      console.error('Erreur chargement groupes:', err)
    }
  }

  // ← types étendus avec class_group_id et academic_year_id
  const createAssignment = async (data: {
    course_element_id: number
    professor_id: number
    is_primary?: boolean
    class_group_id?: number | null
    academic_year_id?: number | null
  }) => {
    const assignment = await CoursService.createCourseElementProfessorAssignment(data)
    await loadAssignments()
    return assignment
  }

  // ← types étendus avec class_group_id et academic_year_id
  const updateAssignment = async (
    id: number,
    data: {
      course_element_id?: number
      professor_id?: number
      is_primary?: boolean
      class_group_id?: number | null
      academic_year_id?: number | null
    },
  ) => {
    const assignment = await CoursService.updateCourseElementProfessorAssignment(id, data)
    await loadAssignments()
    return assignment
  }

  const deleteAssignment = async (id: number) => {
    await CoursService.deleteCourseElementProfessorAssignment(id)
    await loadAssignments()
  }

  useEffect(() => {
    loadAssignments()
    loadCourseElements()
    loadProfessors()
    loadAcademicYears()
    loadClassGroups()
  }, [])

  return {
    assignments,
    courseElements,
    professors,
    academicYears,
    classGroups,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refreshAssignments: loadAssignments,
    setError,
  }
}
