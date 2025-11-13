/**
 * Types pour le module Emploi du Temps
 */

// ============================================
// ENUMS
// ============================================

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum RoomType {
  AMPHITHEATER = 'amphitheater',
  CLASSROOM = 'classroom',
  LAB = 'lab',
  COMPUTER_LAB = 'computer_lab',
  CONFERENCE = 'conference',
}

export enum TimeSlotType {
  LECTURE = 'lecture',
  TD = 'td',
  TP = 'tp',
  EXAM = 'exam',
}

export enum ConflictType {
  ROOM = 'room',
  PROFESSOR = 'professor',
  CLASS_GROUP = 'class_group',
  CAPACITY = 'capacity',
}

// ============================================
// BUILDING (Bâtiment)
// ============================================

export interface Building {
  id: number
  uuid: string
  name: string
  code: string
  address?: string
  description?: string
  is_active: boolean
  rooms_count?: number
  created_at: string
  updated_at: string
}

export interface CreateBuildingRequest {
  name: string
  code: string
  address?: string
  description?: string
  is_active?: boolean
}

// ============================================
// ROOM (Salle)
// ============================================

export interface Room {
  id: number
  uuid: string
  building_id: number
  name: string
  code: string
  capacity: number
  room_type: RoomType
  equipment?: string[]
  is_available: boolean
  building?: Building
  created_at: string
  updated_at: string
}

export interface CreateRoomRequest {
  building_id: number
  name: string
  code: string
  capacity: number
  room_type: RoomType
  equipment?: string[]
  is_available?: boolean
}

// ============================================
// TIME SLOT (Créneau horaire)
// ============================================

export interface TimeSlot {
  id: number
  uuid: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  type: TimeSlotType
  name?: string
  duration_in_minutes: number
  duration_in_hours: number
  created_at: string
  updated_at: string
}

export interface CreateTimeSlotRequest {
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  type: TimeSlotType
  name?: string
}

// ============================================
// SCHEDULED COURSE (Cours planifié)
// ============================================

export interface ScheduledCourse {
  id: number
  uuid: string
  program_id: number
  time_slot_id: number
  room_id: number
  start_date: string
  end_date?: string
  total_hours: number
  hours_completed: number
  remaining_hours: number
  progress_percentage: number
  is_recurring: boolean
  recurrence_end_date?: string
  excluded_dates?: string[]
  notes?: string
  is_cancelled: boolean
  is_completed: boolean
  estimated_end_date?: string
  // Relations
  time_slot?: TimeSlot
  room?: Room
  course_element?: CourseElement
  professor?: Professor
  class_group?: ClassGroup
  created_at: string
  updated_at: string
}

export interface CreateScheduledCourseRequest {
  program_id: number
  time_slot_id: number
  room_id: number
  start_date: string
  total_hours: number
  is_recurring?: boolean
  recurrence_end_date?: string
  notes?: string
}

// ============================================
// CONFLICT DETECTION
// ============================================

export interface ConflictCheckRequest {
  program_id: number
  time_slot_id: number
  room_id: number
  start_date: string
  is_recurring?: boolean
  recurrence_end_date?: string
  scheduled_course_id?: number // Pour exclusion lors de l'update
}

export interface Conflict {
  type: ConflictType
  message: string
  conflicting_course?: {
    id: number
    course_name?: string
    class_group?: string
    room?: string
    professor?: string
    start_date?: string
  }
}

export interface ConflictCheckResponse {
  has_conflicts: boolean
  conflicts?: Conflict[]
}

// ============================================
// SCHEDULE VIEW
// ============================================

export interface ScheduleView {
  id: number
  program_id: number
  start_date: string
  time_slot: {
    id: number
    day_of_week: DayOfWeek
    start_time: string
    end_time: string
    type: TimeSlotType
    duration_in_hours: number
  }
  room: {
    id: number
    name: string
    code: string
    capacity: number
    building: {
      id: number
      name: string
      code: string
    }
  }
  course_element?: {
    id: number
    name: string
    code: string
    credits: number
  }
  professor?: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  class_group?: {
    id: number
    group_name: string
    study_level: string
  }
  is_cancelled: boolean
}

// ============================================
// RELATED TYPES (depuis d'autres modules)
// ============================================

export interface CourseElement {
  id: number
  name: string
  code: string
  credits: number
}

export interface Professor {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface ClassGroup {
  id: number
  group_name: string
  study_level: string
  student_count?: number
}

export interface Program {
  id: number
  class_group_id: number
  course_element_professor_id: number
  class_group?: ClassGroup
  course_element?: CourseElement
  professor?: Professor
}

// ============================================
// CALENDAR EVENT (Pour FullCalendar/React-Big-Calendar)
// ============================================

export interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource?: {
    scheduledCourseId: number
    roomName: string
    roomCode: string
    professorName?: string
    classGroupName?: string
    courseElementName?: string
    is_cancelled: boolean
    progress_percentage?: number
  }
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

// ============================================
// FILTERS & PARAMS
// ============================================

export interface BuildingFilters {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export interface RoomFilters {
  search?: string
  building_id?: number
  room_type?: RoomType
  is_available?: boolean
  min_capacity?: number
  page?: number
  per_page?: number
}

export interface TimeSlotFilters {
  day_of_week?: DayOfWeek
  type?: TimeSlotType
  search?: string
  page?: number
  per_page?: number
}

export interface ScheduledCourseFilters {
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
}

export interface ScheduleFilters {
  start_date?: string
  end_date?: string
}

// ============================================
// DASHBOARD & STATISTICS
// ============================================

export interface EmploiDuTempsStats {
  total_buildings: number
  total_rooms: number
  available_rooms: number
  total_time_slots: number
  total_scheduled_courses: number
  active_courses: number
  completed_courses: number
  cancelled_courses: number
  rooms_utilization_rate: number
  professors_utilization_rate: number
  conflicts_detected: number
}
