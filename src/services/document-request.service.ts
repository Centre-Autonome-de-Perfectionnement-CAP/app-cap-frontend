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
   * Contenu d'une pièce pour le visualiseur, reçu en JSON (base64) puis
   * reconstitué en fichier local. Les gestionnaires de téléchargement
   * (Internet Download Manager…) interceptent les réponses PDF/image, même
   * chargées en arrière-plan ; une réponse JSON n'est jamais interceptée.
   */
  previewFileContent = async (
    id: number,
    source: 'initial' | 'complement' | 'secretary',
    key: string,
  ): Promise<{ url: string; filename?: string; mime: string }> => {
    const res: any = await HttpService.get(
      `${BASE}/${id}/files/${source}/${encodeURIComponent(key)}?format=json`,
    )
    const data = res?.data
    if (!data?.content) throw new Error("Ce document n'a pas pu être chargé.")
    const bin = atob(data.content)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const mime = String(data.mime || 'application/octet-stream')
    return { url: URL.createObjectURL(new Blob([bytes], { type: mime })), filename: data.name, mime }
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

  // ── Commentaires des acteurs sur les pièces du dossier ───────────────────
  // Tout acteur peut commenter ; seul l'auteur modifie / supprime ;
  // l'historique (révisions, commentaires supprimés) n'est renvoyé qu'à la
  // secrétaire et à l'administrateur.

  listFileComments = async (id: number) => {
    return HttpService.get(`${BASE}/${id}/file-comments`)
  }

  addFileComment = async (id: number, source: string, key: string, body: string) => {
    return HttpService.post(`${BASE}/${id}/file-comments`, { file_source: source, file_key: key, body })
  }

  updateFileComment = async (id: number, commentId: number, body: string) => {
    return HttpService.patch(`${BASE}/${id}/file-comments/${commentId}`, { body })
  }

  deleteFileComment = async (id: number, commentId: number) => {
    return HttpService.delete(`${BASE}/${id}/file-comments/${commentId}`)
  }

  /**
   * Message libre secrétaire → demandeur (texte + pièces jointes),
   * envoyé par WhatsApp ET email. Réponse : détail succès/échec par canal
   * avec motif exact en cas d'échec (voir ContactDemandeurModal).
   */
  contactDemandeur = async (id: number, message: string, attachments: File[]) => {
    const formData = new FormData()
    formData.append('message', message)
    attachments.forEach(file => formData.append('attachments[]', file))

    return HttpService.post(`${BASE}/${id}/contact-demandeur`, formData)
  }
}

export default new DocumentRequestService()