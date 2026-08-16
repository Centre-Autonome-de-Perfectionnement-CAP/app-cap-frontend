// src/services/whatsapp.service.ts
//
// Service HTTP pour le module WhatsApp admin.
// Réservé au rôle 'admin' — le contrôle d'accès réel est fait côté backend
// (WhatsAppAdminController::assertAdmin) ; ce service ne fait qu'appeler l'API.
//
// Types alignés EXACTEMENT sur les réponses réelles de WhatsAppAdminController.php
// (pas d'enveloppe {success,data} — Laravel renvoie du JSON plat sur ces endpoints).

import HttpService from './http.service'

const BASE = 'whatsapp/admin'

export interface WhatsAppStatus {
  node_running: boolean
  status: 'connected' | 'connecting' | 'disconnected' | 'unreachable'
  phone: string | null
  display_name: string | null
  connected_at: string | null
  qr: string | null // data URL PNG, présent seulement si status !== 'connected'
}

export interface WaMessageLogRow {
  id: number
  recipient: string
  message: string
  context: string | null
  module: string | null          // détecté automatiquement côté Laravel (namespace de l'appelant)
  file_name: string | null
  media_type: 'text' | 'image' | 'document'
  status: 'queued' | 'sending' | 'sent' | 'failed'
  attempts: number
  last_error: string | null
  queued_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

// Forme standard de Laravel paginate()
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface ModuleCount {
  module: string
  total: number
}

export interface WhatsAppStats {
  queued: number
  sending: number
  sent: number
  failed: number
  total: number
  by_module: Array<{ module: string; sent: number; failed: number; total: number }>
}

class WhatsAppService {
  getStatus = async (): Promise<WhatsAppStatus> => {
    return HttpService.get(`${BASE}/status`)
  }

  logout = async (): Promise<{ success: boolean }> => {
    return HttpService.delete(`${BASE}/session`)
  }

  getMessages = async (
    status?: 'sent' | 'failed' | 'queued' | 'sending',
    page = 1,
    module?: string
  ): Promise<PaginatedResponse<WaMessageLogRow>> => {
    return HttpService.get(`${BASE}/messages`, { params: { status, page, module } })
  }

  getModules = async (): Promise<ModuleCount[]> => {
    return HttpService.get(`${BASE}/messages/modules`)
  }

  retryMessage = async (id: number): Promise<{ success: boolean; message: WaMessageLogRow }> => {
    return HttpService.post(`${BASE}/messages/${id}/retry`)
  }

  getStats = async (): Promise<WhatsAppStats> => {
    return HttpService.get(`${BASE}/stats`)
  }
}

export default new WhatsAppService()
