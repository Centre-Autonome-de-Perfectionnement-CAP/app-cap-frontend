// src/services/document-request.service.ts

import HttpService from './http.service'
import type { WorkflowAction } from '@/types/document-request.types'

const BASE = 'attestations/document-requests'

class DocumentRequestService {
  /**
   * Liste des demandes
   */
  getAll = async (filters: {
    status?: string
    type?: string
    search?: string
    department?: string
  } = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v)
    })

    const qs = params.toString()
    return HttpService.get(qs ? `${BASE}?${qs}` : BASE)
  }

  /**
   * Détail d'une demande
   */
  getOne = async (id: number) => {
    return HttpService.get(`${BASE}/${id}`)
  }

  /**
   * Aperçu / téléchargement d'une pièce jointe (visualiseur intégré).
   * Remplace l'ancien accès direct via /storage/{path} (non authentifié,
   * et source des 403 / aperçus PDF vides constatés).
   * Retourne une URL blob locale (cf. HttpService.downloadFile) prête à être
   * injectée dans un <iframe>/<img> ou un lien de téléchargement.
   */
  previewFile = async (
    id: number,
    source: 'initial' | 'complement' | 'secretary',
    key: string,
  ) => {
    return HttpService.downloadFile(`${BASE}/${id}/files/${source}/${encodeURIComponent(key)}`)
  }

  /**
   * Historique d'une demande
   * (✔️ AJOUTÉ — manquait dans ton service)
   */
  getHistory = async (id: number) => {
    return HttpService.get(`${BASE}/${id}/history`)
  }

  /**
   * Transition de workflow
   */
  transition = async (id: number, payload: WorkflowAction) => {
    return HttpService.post(`${BASE}/${id}/transition`, payload)
  }
}

export default new DocumentRequestService()