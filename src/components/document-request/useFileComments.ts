// src/components/document-request/useFileComments.ts
//
// Commentaires des acteurs sur les pièces d'un dossier : chargement et
// rechargement, partagés entre la liste des pièces et le visualiseur.

import { useCallback, useEffect, useState } from 'react'
import documentRequestService from '@/services/document-request.service'

export interface FileCommentRevision {
  action: 'edited' | 'deleted'
  previous_body: string
  author_name: string
  created_at: string | null
}

export interface FileComment {
  id: number
  file_source: string
  file_key: string
  author_name: string
  author_role: string | null
  author_role_label: string | null
  body: string | null
  created_at: string | null
  edited_at: string | null
  deleted_at: string | null
  is_mine: boolean
  can_edit: boolean
  revisions?: FileCommentRevision[]
}

export const fileRef = (source: string, key: string) => `${source}:${key}`

export default function useFileComments(demandeId?: number) {
  const [comments,       setComments]       = useState<FileComment[]>([])
  const [historyVisible, setHistoryVisible] = useState(false)
  const [loaded,         setLoaded]         = useState(false)

  const reload = useCallback(async () => {
    if (!demandeId) return
    try {
      const res: any = await documentRequestService.listFileComments(demandeId)
      setComments(Array.isArray(res?.data?.comments) ? res.data.comments : [])
      setHistoryVisible(!!res?.data?.history_visible)
    } catch {
      // Lecture non bloquante : la liste des pièces reste utilisable.
    } finally {
      setLoaded(true)
    }
  }, [demandeId])

  useEffect(() => { void reload() }, [reload])

  /** Nombre de commentaires actifs (non supprimés) par pièce. */
  const countFor = useCallback(
    (source: string, key: string) =>
      comments.filter(c => !c.deleted_at && c.file_source === source && c.file_key === key).length,
    [comments],
  )

  return { comments, historyVisible, loaded, reload, countFor }
}
