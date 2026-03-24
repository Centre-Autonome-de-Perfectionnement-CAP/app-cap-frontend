/**
 * Types pour le module Cours (Teaching Units, Course Elements, Resources, Programs)
 */

// ==================== TEACHING UNITS ====================
export interface TeachingUnit {
  id: number;
  name: string;
  code: string;
  course_elements_count?: number;
  course_elements?: CourseElement[];
  created_at: string;
  updated_at: string;
}

export interface CreateTeachingUnitRequest {
  name: string;
  code: string;
}

export interface UpdateTeachingUnitRequest {
  name?: string;
  code?: string;
}

// ==================== COURSE ELEMENTS ====================
export interface CourseElement {
  id: number;
  name: string;
  code: string;
  credits: number;
  teaching_unit_id: number;
  teaching_unit?: TeachingUnit;
  professors?: Professor[];
  professors_count?: number;
  resources?: CourseResource[];
  resources_count?: number;
  programs?: Program[];
  created_at: string;
  updated_at: string;
}

export interface CreateCourseElementRequest {
  name: string;
  code: string;
  credits: number;
  teaching_unit_id: number;
}

export interface UpdateCourseElementRequest {
  name?: string;
  code?: string;
  credits?: number;
  teaching_unit_id?: number;
}

// ==================== PROFESSORS ====================
export interface Professor {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  password?: string;
  role_id?: number;
  rib_number?: string;
  rib?: string;
  rib_url?: string;
  ifu_number?: string;
  ifu?: string;
  ifu_url?: string;
  bank?: string;
  speciality?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  grade_id?: number;
  grade?: {
    id: number;
    name: string;
    abbreviation: string;
  };
  bio?: string;
  created_at?: string;
  updated_at?: string;
  nationality?: string;
  profession?: string;
  city?: string;
  district?: string;
  plot_number?: string;
  house_number?: string;

}

export interface CourseElementProfessor {
  id: number;
  course_element_id: number;
  professor_id: number;
  principal_professor_id: number;
  academic_year_id: number;
  class_group_id: number;
  is_primary: boolean;
  course_element?: CourseElement;
  professor?: Professor;
  principal_professor?: Professor;
  academic_year?: { id: number; name: string };
  class_group?: ClassGroup;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseElementProfessorRequest {
  course_element_id: number;
  professor_id: number;
  principal_professor_id: number;
  academic_year_id: number;
  class_group_id: number;
  is_primary?: boolean;
}

export interface UpdateCourseElementProfessorRequest {
  course_element_id?: number;
  professor_id?: number;
  is_primary?: boolean;
}

export interface AttachProfessorRequest {
  professor_id: number;
}

// ==================== COURSE RESOURCES ====================
export interface CourseResource {
  id: number;
  title: string;
  description?: string;
  resource_type: 'syllabus' | 'cours' | 'td' | 'tp' | 'examen';
  is_public: boolean;
  course_element_id: number;
  course_element?: CourseElement;
  file?: FileInfo;
  file_name?: string;
  file_size?: number;
  file_path?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface FileInfo {
  id: number;
  name: string;
  original_name: string;
  file_name?: string;
  file_size?: number;
  size: number;
  file_path?: string;
  mime_type: string;
  url: string;
  download_url: string;
  created_at: string;
}

export interface CreateCourseResourceRequest {
  title: string;
  description?: string;
  pedagogical_type: 'syllabus' | 'cours' | 'td' | 'tp' | 'examen'
  is_public?: boolean;
  course_element_id: number;
  file: File;
}

export interface UpdateCourseResourceRequest {
  title?: string;
  description?: string;
  resource_type?: 'syllabus' | 'cours' | 'td' | 'tp' | 'examen';
  is_public?: boolean;
}

// ==================== PROGRAMS ====================
export interface ClassGroup {
  id: number;
  name: string;
  department?: any;
  academic_year?: any;
  study_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Program {
  id: number;
  class_group_id: number;
  course_element_professor_id: number;
  academic_year_id: number;
  weighting: { [key: string]: number }; // ex: { "CC": 30, "TP": 20, "EXAMEN": 50 }
  retake_weighting?: { [key: string]: number } | null;
  class_group?: ClassGroup;
  academic_year?: { id: number; name: string };
  course_element_professor?: CourseElementProfessor;
  // Relations exposées par le ProgramResource côté backend
  course_element?: CourseElement;
  professor?: Professor;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramRequest {
  class_group_id: number;
  course_element_professor_id: number;
  academic_year_id: number;
  weighting: { [key: string]: number };
  retake_weighting?: { [key: string]: number };
}

export interface UpdateProgramRequest {
  weighting?: { [key: string]: number };
}

export interface BulkCreateProgramsRequest {
  programs: CreateProgramRequest[];
}

export interface CopyProgramsRequest {
  source_class_group_id: number;
  target_class_group_id: number;
}

export interface BulkProgramsResponse {
  created: Program[];
  errors: any[];
  summary: {
    success_count: number;
    error_count: number;
    total: number;
  };
}

export interface CopyProgramsResponse {
  created: Program[];
  skipped: Array<{
    source_program_id: number;
    course_element_professor_id: number;
    reason: string;
  }>;
  errors: any[];
  summary: {
    total_source: number;
    success_count: number;
    skipped_count: number;
    error_count: number;
  };
}

// ==================== FILTERS & SEARCH ====================
export interface TeachingUnitFilters {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface CourseElementFilters {
  search?: string;
  teaching_unit_id?: number;
  credits?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface CourseResourceFilters {
  search?: string;
  course_element_id?: number;
  resource_type?: string;
  is_public?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface ProgramFilters {
  class_group_id?: number;
  course_element_id?: number;
  professor_id?: number;
  academic_year_id?: number;
  search?: string;
  per_page?: number;
}

export interface RenewRequest {
  current_academic_year_id: number;
  next_academic_year_id: number;
}
