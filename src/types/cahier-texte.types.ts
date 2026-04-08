/**
 * Types pour le module Cahier de Texte
 */

// ============================================
// ENUMS
// ============================================

export enum TextbookEntryStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  VALIDATED = 'validated',
}

export enum CommentType {
  COMMENT = 'comment',
  SUGGESTION = 'suggestion',
  CORRECTION = 'correction',
}

// ============================================
// TEXTBOOK ENTRY (Entrée du cahier de texte)
// ============================================

export interface TextbookEntry {
  id: number
  uuid: string
  program_id: number
  scheduled_course_id?: number
  session_date: string
  start_time: string
  end_time: string
  hours_taught: number
  session_title: string
  content_covered: string
  objectives?: string
  teaching_methods?: string
  homework?: string
  homework_due_date?: string
  resources?: string[]
  attachments?: number[]
  students_present?: number
  students_absent?: number
  observations?: string
  status: TextbookEntryStatus
  published_at?: string
  validated_at?: string
  
  // Relations
  program?: {
    id: number
    uuid: string
  }
  scheduled_course?: {
    id: number
    uuid: string
  }
  course_element?: {
    id: number
    name: string
    code: string
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
  validator?: {
    id: number
    name: string
    email: string
  }
  comments_count?: number
  
  created_at: string
  updated_at: string
}

export interface CreateTextbookEntryRequest {
  program_id: number
  scheduled_course_id?: number
  session_date: string
  start_time: string
  end_time: string
  hours_taught: number
  session_title: string
  content_covered: string
  objectives?: string
  teaching_methods?: string
  homework?: string
  homework_due_date?: string
  resources?: string[]
  attachments?: number[]
  students_present?: number
  students_absent?: number
  observations?: string
  status?: TextbookEntryStatus
}

export interface UpdateTextbookEntryRequest extends Partial<CreateTextbookEntryRequest> {}

// ============================================
// TEXTBOOK COMMENT (Commentaire)
// ============================================

export interface TextbookComment {
  id: number
  uuid: string
  textbook_entry_id: number
  user_id: number
  comment: string
  type: CommentType
  parent_id?: number
  
  // Relations
  user?: {
    id: number
    name: string
    email: string
  }
  parent?: TextbookComment
  replies?: TextbookComment[]
  
  created_at: string
  updated_at: string
}

export interface CreateTextbookCommentRequest {
  comment: string
  type?: CommentType
  parent_id?: number
}

// ============================================
// FILTERS & PARAMS
// ============================================

export interface TextbookEntryFilters {
  search?: string
  program_id?: number
  class_group_id?: number
  professor_id?: number
  status?: TextbookEntryStatus
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}

// ============================================
// STATISTICS
// ============================================

export interface TextbookStatistics {
  total_entries: number
  draft_entries: number
  published_entries: number
  validated_entries: number
  total_hours_taught: number
  entries_with_homework: number
}
