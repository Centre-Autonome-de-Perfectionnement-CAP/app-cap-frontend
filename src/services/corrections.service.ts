import HttpService from './http.service.ts'

const BASE = 'inscription/corrections'

export interface CorrectionRequest {
  id: string
  student_id_number: string
  current_values: Record<string, any>
  suggested_values: Record<string, any>
  changed_fields: string[]
  justification: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_by: { id: number; name: string } | null
  reviewed_at: string | null
  created_at: string
}

export interface CorrectionListResponse {
  data: CorrectionRequest[]
  counts: {
    pending: number
    approved: number
    rejected: number
  }
}

const FIELD_LABELS: Record<string, string> = {
  last_name: 'Nom',
  first_names: 'Prénoms',
  email: 'Adresse email',
  contacts: 'Numéro(s) de téléphone',
}

/**
 * Récupère toutes les demandes de correction (admin)
 */
const getCorrectionRequests = async (filters: {
  status?: string
  student_id_number?: string
} = {}): Promise<CorrectionListResponse> => {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.student_id_number) params.append('student_id_number', filters.student_id_number)

  const query = params.toString()
  const url = query ? `${BASE}?${query}` : BASE
  const response = await HttpService.get<CorrectionListResponse>(url)
  return response as unknown as CorrectionListResponse
}

/**
 * Approuve une demande de correction
 */
const approveRequest = async (id: string): Promise<void> => {
  await HttpService.patch(`${BASE}/${id}/approve`, {})
}

/**
 * Rejette une demande de correction avec un motif
 */
const rejectRequest = async (id: string, rejectionReason: string): Promise<void> => {
  await HttpService.patch(`${BASE}/${id}/reject`, { rejection_reason: rejectionReason })
}

const correctionsService = {
  getCorrectionRequests,
  approveRequest,
  rejectRequest,
  FIELD_LABELS,
}

export default correctionsService
