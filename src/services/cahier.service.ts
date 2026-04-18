import HttpService from './http.service.ts'
import { CAHIER_ROUTES } from '@/constants/routes.constants'
import type {
  TextbookEntry,
  CreateTextbookEntryRequest,
  UpdateTextbookEntryRequest,
  TextbookComment,
  CreateTextbookCommentRequest,
  TextbookStatistics,
} from '@/types/cahier-texte.types'

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
 * Service pour le module Cahier de Texte
 */
class CahierService {
  // ============================================
  // TEXTBOOK ENTRIES
  // ============================================

  /**
   * Récupérer la liste des entrées
   *
   * ✅ CORRIGÉ : quand aucun statut n'est fourni, le backend applique
   * automatiquement le filtre par défaut (published + validated).
   * Le service ne force plus de valeur par défaut côté front pour
   * laisser la logique métier au backend.
   */
  getEntries = async (params?: {
    search?: string
    program_id?: number
    class_group_id?: number
    professor_id?: number
    /**
     * Valeurs possibles : 'draft' | 'published' | 'validated'
     * Si absent → le backend retourne published + validated uniquement
     */
    status?: string
    start_date?: string
    end_date?: string
    page?: number
    per_page?: number
  }): Promise<{ data: TextbookEntry[]; meta: any }> => {
    const url = buildUrlWithParams(CAHIER_ROUTES.LIST, params)
    const response = await HttpService.get<{ success: boolean; data: TextbookEntry[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupérer une entrée spécifique
   */
  getEntry = async (id: number): Promise<TextbookEntry> => {
    const response = await HttpService.get<{ success: boolean; data: TextbookEntry }>(
      CAHIER_ROUTES.DETAIL(id)
    )
    return response.data
  }

  /**
   * Créer une nouvelle entrée
   */
  createEntry = async (data: CreateTextbookEntryRequest): Promise<TextbookEntry> => {
    const response = await HttpService.post<{ success: boolean; data: TextbookEntry }>(
      CAHIER_ROUTES.LIST,
      data
    )
    return response.data
  }

  /**
   * Mettre à jour une entrée
   */
  updateEntry = async (id: number, data: UpdateTextbookEntryRequest): Promise<TextbookEntry> => {
    const response = await HttpService.put<{ success: boolean; data: TextbookEntry }>(
      CAHIER_ROUTES.DETAIL(id),
      data
    )
    return response.data
  }

  /**
   * Supprimer une entrée
   */
  deleteEntry = async (id: number): Promise<void> => {
    await HttpService.delete(CAHIER_ROUTES.DETAIL(id))
  }

  /**
   * Publier (signer) une entrée : draft → published
   */
  publishEntry = async (id: number): Promise<TextbookEntry> => {
    const response = await HttpService.post<{ success: boolean; data: TextbookEntry }>(
      `${CAHIER_ROUTES.DETAIL(id)}/publish`
    )
    return response.data
  }

  /**
   * Valider une entrée : published → validated
   *
   * ✅ CORRIGÉ : méthode existait déjà dans le service mais la route backend
   * POST /{id}/validate était manquante → maintenant corrigée dans api.php
   */
  validateEntry = async (id: number): Promise<TextbookEntry> => {
    const response = await HttpService.post<{ success: boolean; data: TextbookEntry }>(
      `${CAHIER_ROUTES.DETAIL(id)}/validate`
    )
    return response.data
  }

  /**
   * Récupérer les entrées par groupe de classe
   */
  getEntriesByClassGroup = async (
    classGroupId: number,
    params?: { start_date?: string; end_date?: string; status?: string; per_page?: number }
  ): Promise<{ data: TextbookEntry[]; meta: any }> => {
    const url = buildUrlWithParams(CAHIER_ROUTES.BY_CLASSE(classGroupId), params)
    const response = await HttpService.get<{ success: boolean; data: TextbookEntry[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupérer les entrées par professeur
   */
  getEntriesByProfessor = async (
    professorId: number,
    params?: { start_date?: string; end_date?: string; status?: string; per_page?: number }
  ): Promise<{ data: TextbookEntry[]; meta: any }> => {
    const url = buildUrlWithParams(`${CAHIER_ROUTES.BASE}/professor/${professorId}`, params)
    const response = await HttpService.get<{ success: boolean; data: TextbookEntry[]; meta: any }>(url)
    return { data: response.data, meta: response.meta }
  }

  /**
   * Récupérer les statistiques
   */
  getStatistics = async (params?: {
    start_date?: string
    end_date?: string
    class_group_id?: number
    professor_id?: number
  }): Promise<TextbookStatistics> => {
    const url = buildUrlWithParams(`${CAHIER_ROUTES.BASE}/statistics/all`, params)
    const response = await HttpService.get<{ success: boolean; data: TextbookStatistics }>(url)
    return response.data
  }

  // ============================================
  // COMMENTS
  // ============================================

  /**
   * Récupérer les commentaires d'une entrée
   */
  getComments = async (entryId: number): Promise<TextbookComment[]> => {
    const response = await HttpService.get<{ success: boolean; data: TextbookComment[] }>(
      `${CAHIER_ROUTES.DETAIL(entryId)}/comments`
    )
    return response.data
  }

  /**
   * Créer un commentaire
   */
  createComment = async (
    entryId: number,
    data: CreateTextbookCommentRequest
  ): Promise<TextbookComment> => {
    const response = await HttpService.post<{ success: boolean; data: TextbookComment }>(
      `${CAHIER_ROUTES.DETAIL(entryId)}/comments`,
      data
    )
    return response.data
  }

  /**
   * Mettre à jour un commentaire
   */
  updateComment = async (
    entryId: number,
    commentId: number,
    data: { comment: string }
  ): Promise<TextbookComment> => {
    const response = await HttpService.put<{ success: boolean; data: TextbookComment }>(
      `${CAHIER_ROUTES.DETAIL(entryId)}/comments/${commentId}`,
      data
    )
    return response.data
  }

  /**
   * Supprimer un commentaire
   */
  deleteComment = async (entryId: number, commentId: number): Promise<void> => {
    await HttpService.delete(`${CAHIER_ROUTES.DETAIL(entryId)}/comments/${commentId}`)
  }
}

export default new CahierService()