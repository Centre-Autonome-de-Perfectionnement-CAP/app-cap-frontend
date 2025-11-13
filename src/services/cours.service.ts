import HttpService from './http.service'
import { COURS_ROUTES } from '@/constants/routes.constants'
import type {
  TeachingUnit,
  CourseElement,
  CourseResource,
  Program,
  CreateTeachingUnitRequest,
  UpdateTeachingUnitRequest,
  CreateCourseElementRequest,
  UpdateCourseElementRequest,
  CreateCourseResourceRequest,
  UpdateCourseResourceRequest,
  CreateProgramRequest,
  UpdateProgramRequest,
  BulkCreateProgramsRequest,
  CopyProgramsRequest,
  AttachProfessorRequest,
  TeachingUnitFilters,
  CourseElementFilters,
  CourseResourceFilters,
  ProgramFilters,
  PaginatedResponse,
  ApiResponse,
  Professor,
  ClassGroup
} from '@/types/cours.types'

/**
 * Service pour le module Cours
 * Gestion des UE, ECUE, Ressources et Programmes
 */
class CoursService {

  // ==================== TEACHING UNITS ====================

  /**
   * Récupère la liste des unités d'enseignement avec pagination et filtres
   */
  getTeachingUnits = async (filters: TeachingUnitFilters = {}): Promise<PaginatedResponse<TeachingUnit>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `${COURS_ROUTES.TEACHING_UNITS}?${params.toString()}`
      : COURS_ROUTES.TEACHING_UNITS
    
    const response = await HttpService.get<ApiResponse<PaginatedResponse<TeachingUnit>>>(url)
    return response.data
  }

  /**
   * Récupère une unité d'enseignement par ID
   */
  getTeachingUnit = async (id: number | string): Promise<TeachingUnit> => {
    const response = await HttpService.get<ApiResponse<TeachingUnit>>(COURS_ROUTES.TEACHING_UNIT(id))
    return response.data
  }

  /**
   * Crée une nouvelle unité d'enseignement
   */
  createTeachingUnit = async (data: CreateTeachingUnitRequest): Promise<TeachingUnit> => {
    const response = await HttpService.post<ApiResponse<TeachingUnit>>(COURS_ROUTES.TEACHING_UNITS, data)
    return response.data
  }

  /**
   * Met à jour une unité d'enseignement
   */
  updateTeachingUnit = async (id: number | string, data: UpdateTeachingUnitRequest): Promise<TeachingUnit> => {
    const response = await HttpService.put<ApiResponse<TeachingUnit>>(COURS_ROUTES.TEACHING_UNIT(id), data)
    return response.data
  }

  /**
   * Supprime une unité d'enseignement
   */
  deleteTeachingUnit = async (id: number | string): Promise<void> => {
    await HttpService.delete(COURS_ROUTES.TEACHING_UNIT(id))
  }

  /**
   * Récupère les ECUE d'une unité d'enseignement
   */
  getTeachingUnitCourseElements = async (id: number | string): Promise<CourseElement[]> => {
    const response = await HttpService.get<ApiResponse<CourseElement[]>>(COURS_ROUTES.TEACHING_UNIT_COURSE_ELEMENTS(id))
    return response.data
  }

  // ==================== COURSE ELEMENTS ====================

  /**
   * Récupère la liste des éléments de cours avec pagination et filtres
   */
  getCourseElements = async (filters: CourseElementFilters = {}): Promise<PaginatedResponse<CourseElement>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `${COURS_ROUTES.COURSE_ELEMENTS}?${params.toString()}`
      : COURS_ROUTES.COURSE_ELEMENTS
    
    const response = await HttpService.get<ApiResponse<PaginatedResponse<CourseElement>>>(url)
    return response.data
  }

  /**
   * Récupère un élément de cours par ID
   */
  getCourseElement = async (id: number | string): Promise<CourseElement> => {
    const response = await HttpService.get<ApiResponse<CourseElement>>(COURS_ROUTES.COURSE_ELEMENT(id))
    return response.data
  }

  /**
   * Crée un nouvel élément de cours
   */
  createCourseElement = async (data: CreateCourseElementRequest): Promise<CourseElement> => {
    const response = await HttpService.post<ApiResponse<CourseElement>>(COURS_ROUTES.COURSE_ELEMENTS, data)
    return response.data
  }

  /**
   * Met à jour un élément de cours
   */
  updateCourseElement = async (id: number | string, data: UpdateCourseElementRequest): Promise<CourseElement> => {
    const response = await HttpService.put<ApiResponse<CourseElement>>(COURS_ROUTES.COURSE_ELEMENT(id), data)
    return response.data
  }

  /**
   * Supprime un élément de cours
   */
  deleteCourseElement = async (id: number | string): Promise<void> => {
    await HttpService.delete(COURS_ROUTES.COURSE_ELEMENT(id))
  }

  /**
   * Attache un professeur à un élément de cours
   */
  attachProfessor = async (courseElementId: number | string, data: AttachProfessorRequest): Promise<void> => {
    await HttpService.post(COURS_ROUTES.COURSE_ELEMENT_PROFESSORS_ATTACH(courseElementId), data)
  }

  /**
   * Détache un professeur d'un élément de cours
   */
  detachProfessor = async (courseElementId: number | string, data: AttachProfessorRequest): Promise<void> => {
    await HttpService.post(COURS_ROUTES.COURSE_ELEMENT_PROFESSORS_DETACH(courseElementId), data)
  }

  /**
   * Récupère les professeurs d'un élément de cours
   */
  getCourseElementProfessors = async (id: number | string): Promise<Professor[]> => {
    const response = await HttpService.get<ApiResponse<Professor[]>>(COURS_ROUTES.COURSE_ELEMENT_PROFESSORS(id))
    return response.data
  }

  /**
   * Récupère les ressources d'un élément de cours
   */
  getCourseElementResources = async (id: number | string): Promise<CourseResource[]> => {
    const response = await HttpService.get<ApiResponse<CourseResource[]>>(COURS_ROUTES.COURSE_ELEMENT_RESOURCES(id))
    return response.data
  }

  // ==================== COURSE RESOURCES ====================

  /**
   * Récupère la liste des ressources avec pagination et filtres
   */
  getCourseResources = async (filters: CourseResourceFilters = {}): Promise<PaginatedResponse<CourseResource>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `${COURS_ROUTES.COURSE_RESOURCES}?${params.toString()}`
      : COURS_ROUTES.COURSE_RESOURCES
    
    const response = await HttpService.get<ApiResponse<PaginatedResponse<CourseResource>>>(url)
    return response.data
  }

  /**
   * Récupère une ressource par ID
   */
  getCourseResource = async (id: number | string): Promise<CourseResource> => {
    const response = await HttpService.get<ApiResponse<CourseResource>>(COURS_ROUTES.COURSE_RESOURCE(id))
    return response.data
  }

  /**
   * Crée une nouvelle ressource (avec upload de fichier)
   */
  createCourseResource = async (data: CreateCourseResourceRequest): Promise<CourseResource> => {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('resource_type', data.resource_type)
    formData.append('is_public', data.is_public ? '1' : '0')
    formData.append('course_element_id', data.course_element_id.toString())
    formData.append('file', data.file)
    
    const response = await HttpService.post<ApiResponse<CourseResource>>(COURS_ROUTES.COURSE_RESOURCES, formData)
    return response.data
  }

  /**
   * Met à jour une ressource
   */
  updateCourseResource = async (id: number | string, data: UpdateCourseResourceRequest): Promise<CourseResource> => {
    const response = await HttpService.put<ApiResponse<CourseResource>>(COURS_ROUTES.COURSE_RESOURCE(id), data)
    return response.data
  }

  /**
   * Supprime une ressource
   */
  deleteCourseResource = async (id: number | string): Promise<void> => {
    await HttpService.delete(COURS_ROUTES.COURSE_RESOURCE(id))
  }

  // ==================== PROGRAMS ====================

  /**
   * Récupère la liste des programmes avec pagination et filtres
   */
  getPrograms = async (filters: ProgramFilters = {}): Promise<PaginatedResponse<Program>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const url = params.toString() 
      ? `${COURS_ROUTES.PROGRAMS}?${params.toString()}`
      : COURS_ROUTES.PROGRAMS
    
    const response = await HttpService.get<ApiResponse<PaginatedResponse<Program>>>(url)
    return response.data
  }

  /**
   * Récupère un programme par ID
   */
  getProgram = async (id: number | string): Promise<Program> => {
    const response = await HttpService.get<ApiResponse<Program>>(COURS_ROUTES.PROGRAM(id))
    return response.data
  }

  /**
   * Crée un nouveau programme
   */
  createProgram = async (data: CreateProgramRequest): Promise<Program> => {
    const response = await HttpService.post<ApiResponse<Program>>(COURS_ROUTES.PROGRAMS, data)
    return response.data
  }

  /**
   * Met à jour un programme
   */
  updateProgram = async (id: number | string, data: UpdateProgramRequest): Promise<Program> => {
    const response = await HttpService.put<ApiResponse<Program>>(COURS_ROUTES.PROGRAM(id), data)
    return response.data
  }

  /**
   * Supprime un programme
   */
  deleteProgram = async (id: number | string): Promise<void> => {
    await HttpService.delete(COURS_ROUTES.PROGRAM(id))
  }

  /**
   * Crée plusieurs programmes en masse
   */
  bulkCreatePrograms = async (data: BulkCreateProgramsRequest) => {
    const response = await HttpService.post(COURS_ROUTES.PROGRAMS_BULK, data)
    return response.data
  }

  /**
   * Copie les programmes d'une classe vers une autre
   */
  copyPrograms = async (data: CopyProgramsRequest) => {
    const response = await HttpService.post(COURS_ROUTES.PROGRAMS_COPY, data)
    return response.data
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Récupère les programmes d'un groupe de classe
   */
  getClassGroupPrograms = async (classGroupId: number | string): Promise<Program[]> => {
    const response = await HttpService.get<ApiResponse<Program[]>>(COURS_ROUTES.CLASS_GROUP_PROGRAMS(classGroupId))
    return response.data
  }

  /**
   * Récupère les programmes d'un professeur
   */
  getProfessorPrograms = async (professorId: number | string): Promise<Program[]> => {
    const response = await HttpService.get<ApiResponse<Program[]>>(COURS_ROUTES.PROFESSOR_PROGRAMS(professorId))
    return response.data
  }

  /**
   * Récupère les programmes d'un élément de cours
   */
  getCourseElementPrograms = async (courseElementId: number | string): Promise<Program[]> => {
    const response = await HttpService.get<ApiResponse<Program[]>>(COURS_ROUTES.COURSE_ELEMENT_PROGRAMS(courseElementId))
    return response.data
  }

  // ==================== REFERENCE DATA ====================

  /**
   * Récupère la liste des professeurs (pour les selects)
   */
  getProfessors = async (): Promise<Professor[]> => {
    // TODO: Adapter selon l'endpoint backend réel pour les professeurs
    const response = await HttpService.get<ApiResponse<Professor[]>>('/professors')
    return response.data
  }

  /**
   * Récupère la liste des groupes de classe (pour les selects)
   */
  getClassGroups = async (): Promise<ClassGroup[]> => {
    // TODO: Adapter selon l'endpoint backend réel pour les groupes de classe
    const response = await HttpService.get<ApiResponse<ClassGroup[]>>('/class-groups')
    return response.data
  }
}

export default new CoursService()
