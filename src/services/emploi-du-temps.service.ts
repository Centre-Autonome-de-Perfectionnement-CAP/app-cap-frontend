import HttpService from './http.service.ts'
import { EMPLOI_DU_TEMPS_ROUTES } from '@/constants/routes.constants'
import type {
  Building,
  Room,
  TimeSlot,
  ScheduledCourse,
  ConflictCheckRequest,
  ConflictCheckResponse,
  ScheduleView,
  CreateBuildingRequest,
  CreateRoomRequest,
  CreateTimeSlotRequest,
  CreateScheduledCourseRequest,
} from '@/types/emploi-du-temps.types'

/**
 * Utilitaire pour construire des URLs avec des paramètres de requête
 */
const buildUrlWithParams = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl
  }

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Service pour le module Emploi du Temps
 * Gère les bâtiments, salles, créneaux horaires et cours planifiés
 */
class EmploiDuTempsService {
  // ============================================
  // BUILDINGS (Bâtiments)
  // ============================================

  /**
   * Récupère la liste des bâtiments
   */
  getBuildings = async (params?: {
    search?: string
    is_active?: boolean
    page?: number
    per_page?: number
  }): Promise<{ data: Building[]; meta: any }> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.BUILDINGS, params)
    const response = await HttpService.get<{ success: boolean; data: Building[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupère un bâtiment spécifique
   */
  getBuilding = async (id: number): Promise<Building> => {
    const response = await HttpService.get<{ success: boolean; data: Building }>(
      EMPLOI_DU_TEMPS_ROUTES.BUILDING(id)
    )
    return response.data
  }

  /**
   * Crée un nouveau bâtiment
   */
  createBuilding = async (data: CreateBuildingRequest): Promise<Building> => {
    const response = await HttpService.post<{ success: boolean; data: Building }>(
      EMPLOI_DU_TEMPS_ROUTES.BUILDINGS,
      data
    )
    return response.data
  }

  /**
   * Met à jour un bâtiment
   */
  updateBuilding = async (id: number, data: Partial<CreateBuildingRequest>): Promise<Building> => {
    const response = await HttpService.put<{ success: boolean; data: Building }>(
      EMPLOI_DU_TEMPS_ROUTES.BUILDING(id),
      data
    )
    return response.data
  }

  /**
   * Supprime un bâtiment
   */
  deleteBuilding = async (id: number): Promise<void> => {
    await HttpService.delete(EMPLOI_DU_TEMPS_ROUTES.BUILDING(id))
  }

  // ============================================
  // ROOMS (Salles)
  // ============================================

  /**
   * Récupère la liste des salles
   */
  getRooms = async (params?: {
    search?: string
    building_id?: number
    room_type?: string
    is_available?: boolean
    min_capacity?: number
    page?: number
    per_page?: number
  }): Promise<{ data: Room[]; meta: any }> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.ROOMS, params)
    const response = await HttpService.get<{ success: boolean; data: Room[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupère une salle spécifique
   */
  getRoom = async (id: number): Promise<Room> => {
    const response = await HttpService.get<{ success: boolean; data: Room }>(
      EMPLOI_DU_TEMPS_ROUTES.ROOM(id)
    )
    return response.data
  }

  /**
   * Récupère les salles disponibles pour un créneau
   */
  getAvailableRooms = async (params: {
    time_slot_id: number
    date: string
    min_capacity?: number
  }): Promise<Room[]> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.ROOMS_AVAILABLE, params)
    const response = await HttpService.get<{ success: boolean; data: Room[] }>(url)
    return response.data
  }

  /**
   * Crée une nouvelle salle
   */
  createRoom = async (data: CreateRoomRequest): Promise<Room> => {
    const response = await HttpService.post<{ success: boolean; data: Room }>(
      EMPLOI_DU_TEMPS_ROUTES.ROOMS,
      data
    )
    return response.data
  }

  /**
   * Met à jour une salle
   */
  updateRoom = async (id: number, data: Partial<CreateRoomRequest>): Promise<Room> => {
    const response = await HttpService.put<{ success: boolean; data: Room }>(
      EMPLOI_DU_TEMPS_ROUTES.ROOM(id),
      data
    )
    return response.data
  }

  /**
   * Supprime une salle
   */
  deleteRoom = async (id: number): Promise<void> => {
    await HttpService.delete(EMPLOI_DU_TEMPS_ROUTES.ROOM(id))
  }

  // ============================================
  // TIME SLOTS (Créneaux horaires)
  // ============================================

  /**
   * Récupère la liste des créneaux horaires
   */
  getTimeSlots = async (params?: {
    day_of_week?: string
    type?: string
    search?: string
    page?: number
    per_page?: number
  }): Promise<{ data: TimeSlot[]; meta: any }> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.TIME_SLOTS, params)
    const response = await HttpService.get<{ success: boolean; data: TimeSlot[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupère un créneau horaire spécifique
   */
  getTimeSlot = async (id: number): Promise<TimeSlot> => {
    const response = await HttpService.get<{ success: boolean; data: TimeSlot }>(
      EMPLOI_DU_TEMPS_ROUTES.TIME_SLOT(id)
    )
    return response.data
  }

  /**
   * Récupère les créneaux d'un jour spécifique
   */
  getTimeSlotsByDay = async (day: string): Promise<TimeSlot[]> => {
    const response = await HttpService.get<{ success: boolean; data: TimeSlot[] }>(
      EMPLOI_DU_TEMPS_ROUTES.TIME_SLOTS_BY_DAY(day)
    )
    return response.data
  }

  /**
   * Crée un nouveau créneau horaire
   */
  createTimeSlot = async (data: CreateTimeSlotRequest): Promise<TimeSlot> => {
    const response = await HttpService.post<{ success: boolean; data: TimeSlot }>(
      EMPLOI_DU_TEMPS_ROUTES.TIME_SLOTS,
      data
    )
    return response.data
  }

  /**
   * Met à jour un créneau horaire
   */
  updateTimeSlot = async (id: number, data: Partial<CreateTimeSlotRequest>): Promise<TimeSlot> => {
    const response = await HttpService.put<{ success: boolean; data: TimeSlot }>(
      EMPLOI_DU_TEMPS_ROUTES.TIME_SLOT(id),
      data
    )
    return response.data
  }

  /**
   * Supprime un créneau horaire
   */
  deleteTimeSlot = async (id: number): Promise<void> => {
    await HttpService.delete(EMPLOI_DU_TEMPS_ROUTES.TIME_SLOT(id))
  }

  // ============================================
  // SCHEDULED COURSES (Cours planifiés)
  // ============================================

  /**
   * Récupère la liste des cours planifiés
   */
  getScheduledCourses = async (params?: {
    search?: string
    program_id?: number
    time_slot_id?: number
    room_id?: number
    class_group_id?: number
    professor_id?: number
    start_date?: string
    end_date?: string
    is_cancelled?: boolean
    is_recurring?: boolean
    page?: number
    per_page?: number
  }): Promise<{ data: ScheduledCourse[]; meta: any }> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.SCHEDULED_COURSES, params)
    const response = await HttpService.get<{ success: boolean; data: ScheduledCourse[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupère un cours planifié spécifique
   */
  getScheduledCourse = async (id: number): Promise<ScheduledCourse> => {
    const response = await HttpService.get<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.SCHEDULED_COURSE(id)
    )
    return response.data
  }

  /**
   * Vérifie les conflits avant de créer/modifier un cours
   */
  checkConflicts = async (data: ConflictCheckRequest): Promise<ConflictCheckResponse> => {
    const response = await HttpService.post<{ success: boolean; data: ConflictCheckResponse }>(
      EMPLOI_DU_TEMPS_ROUTES.CHECK_CONFLICTS,
      data
    )
    return response.data
  }

  /**
   * Crée un nouveau cours planifié
   */
  createScheduledCourse = async (data: CreateScheduledCourseRequest): Promise<ScheduledCourse> => {
    const response = await HttpService.post<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.SCHEDULED_COURSES,
      data
    )
    return response.data
  }

  /**
   * Met à jour un cours planifié
   */
  updateScheduledCourse = async (
    id: number,
    data: Partial<CreateScheduledCourseRequest>
  ): Promise<ScheduledCourse> => {
    const response = await HttpService.put<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.SCHEDULED_COURSE(id),
      data
    )
    return response.data
  }

  /**
   * Supprime un cours planifié
   */
  deleteScheduledCourse = async (id: number): Promise<void> => {
    await HttpService.delete(EMPLOI_DU_TEMPS_ROUTES.SCHEDULED_COURSE(id))
  }

  /**
   * Annule un cours planifié
   */
  cancelScheduledCourse = async (id: number, notes?: string): Promise<ScheduledCourse> => {
    const response = await HttpService.post<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.CANCEL_COURSE(id),
      { notes }
    )
    return response.data
  }

  /**
   * Met à jour les heures effectuées d'un cours
   */
  updateCompletedHours = async (id: number, hours: number): Promise<ScheduledCourse> => {
    const response = await HttpService.post<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.UPDATE_HOURS(id),
      { hours_completed: hours }
    )
    return response.data
  }

  /**
   * Exclut une date d'un cours récurrent
   */
  excludeDate = async (id: number, date: string): Promise<ScheduledCourse> => {
    const response = await HttpService.post<{ success: boolean; data: ScheduledCourse }>(
      EMPLOI_DU_TEMPS_ROUTES.EXCLUDE_DATE(id),
      { date }
    )
    return response.data
  }

  /**
   * Récupère toutes les occurrences d'un cours récurrent
   */
  getOccurrences = async (id: number): Promise<{ occurrences: string[]; total_occurrences: number }> => {
    const response = await HttpService.get<{
      success: boolean
      data: { occurrences: string[]; total_occurrences: number }
    }>(EMPLOI_DU_TEMPS_ROUTES.OCCURRENCES(id))
    return response.data
  }

  // ============================================
  // SCHEDULE VIEWS (Vues emploi du temps)
  // ============================================

  /**
   * Récupère l'emploi du temps d'un groupe de classe
   */
  getScheduleByClassGroup = async (
    classGroupId: number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ScheduleView[]> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.SCHEDULE_BY_CLASS_GROUP(classGroupId), params)
    const response = await HttpService.get<{ success: boolean; data: ScheduleView[] }>(url)
    return response.data
  }

  /**
   * Récupère l'emploi du temps d'un professeur
   */
  getScheduleByProfessor = async (
    professorId: number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ScheduleView[]> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.SCHEDULE_BY_PROFESSOR(professorId), params)
    const response = await HttpService.get<{ success: boolean; data: ScheduleView[] }>(url)
    return response.data
  }

  /**
   * Récupère l'emploi du temps d'une salle
   */
  getScheduleByRoom = async (
    roomId: number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ScheduleView[]> => {
    const url = buildUrlWithParams(EMPLOI_DU_TEMPS_ROUTES.SCHEDULE_BY_ROOM(roomId), params)
    const response = await HttpService.get<{ success: boolean; data: ScheduleView[] }>(url)
    return response.data
  }
}

export default new EmploiDuTempsService()
