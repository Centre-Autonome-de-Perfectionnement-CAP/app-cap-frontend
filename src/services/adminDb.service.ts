// src/services/adminDb.service.ts
//
// Service HTTP pour l'outil d'administration brute des tables.
// Réservé au rôle 'admin' — le contrôle d'accès réel est fait côté backend
// (AdminTableController::assertAdmin) ; ce service ne fait qu'appeler l'API.

import HttpService from './http.service'

const BASE = 'admin-db/tables'

export interface AdminTableSummary {
  name: string
  count: number
}

export interface AdminTableData {
  table: string
  columns: string[]
  rows: Record<string, any>[]
  page: number
  perPage: number
  total: number
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

class AdminDbService {
  /**
   * Liste des tables administrables (whitelist définie côté backend).
   */
  getTables = async (): Promise<ApiEnvelope<AdminTableSummary[]>> => {
    return HttpService.get(BASE)
  }

  /**
   * Colonnes + lignes paginées d'une table autorisée.
   */
  getTableData = async (table: string, page = 1): Promise<ApiEnvelope<AdminTableData>> => {
    return HttpService.get(`${BASE}/${table}`, { params: { page } })
  }

  /**
   * Création d'une ligne. payload = { colonne: valeur, ... }
   */
  createRow = async (table: string, payload: Record<string, any>): Promise<ApiEnvelope<{ id: number }>> => {
    return HttpService.post(`${BASE}/${table}`, payload)
  }

  /**
   * Mise à jour d'une ligne existante.
   */
  updateRow = async (table: string, id: number, payload: Record<string, any>): Promise<ApiEnvelope<null>> => {
    return HttpService.put(`${BASE}/${table}/${id}`, payload)
  }

  /**
   * Suppression d'une ligne.
   */
  deleteRow = async (table: string, id: number): Promise<ApiEnvelope<null>> => {
    return HttpService.delete(`${BASE}/${table}/${id}`)
  }
}

export default new AdminDbService()
