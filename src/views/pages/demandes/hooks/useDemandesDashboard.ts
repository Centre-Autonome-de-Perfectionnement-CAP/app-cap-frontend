// src/views/pages/demandes/hooks/useDemandesDashboard.ts

import { useState, useEffect, useCallback } from 'react'
import documentRequestService from '@/services/document-request.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { successFeedback, FAILURE_TITLE } from '../utils/actionFeedback'
import type { DocumentRequest } from '@/types/document-request.types'

interface Filters { search?: string; type?: string }

interface UseDemandesDashboardReturn {
  demandes: DocumentRequest[]
  loading: boolean
  filters: Filters
  setFilters: (f: Filters) => void
  selected: DocumentRequest | null
  detailOpen: boolean
  openDetail: (d: DocumentRequest) => void
  closeDetail: () => void
  handleAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  reload: () => Promise<void>
}

// Rafraîchissement silencieux en arrière-plan. CORRECTIF : 2 s générait une
// requête de listing (lourde : jointures + sous-requêtes) toutes les 2 s par
// onglet ouvert. 10 s reste quasi temps réel pour un circuit de validation,
// et aucun appel n'est fait quand l'onglet n'est pas visible.
const POLLING_INTERVAL_MS = 10_000

const useDemandesDashboard = (initialFilters: Filters = {}): UseDemandesDashboardReturn => {
  const [demandes,   setDemandes]   = useState<DocumentRequest[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filters,    setFilters]    = useState<Filters>(initialFilters)
  const [selected,   setSelected]   = useState<DocumentRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await documentRequestService.getAll(filters)
      const list = res.data || []
      setDemandes(list)
      setSelected(prev => {
        if (!prev) return null
        const fresh = list.find((d: DocumentRequest) => d.id === prev.id)
        return fresh || prev
      })
    } catch (e) {
      console.error('Erreur chargement demandes:', e)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [filters])

  // Initial load on mount or when filters change
  useEffect(() => {
    load(false)
  }, [load])

  // Polling silencieux (voir POLLING_INTERVAL_MS) — suspendu si l'onglet est masqué
  useEffect(() => {
    let isMounted = true
    let isFetching = false

    const interval = setInterval(async () => {
      if (isFetching || document.visibilityState === 'hidden') return
      isFetching = true
      try {
        const res = await documentRequestService.getAll(filters)
        if (isMounted) {
          const list = res.data || []
          setDemandes(list)
          setSelected(prev => {
            if (!prev) return null
            const fresh = list.find((d: DocumentRequest) => d.id === prev.id)
            return fresh || prev
          })
        }
      } catch (e) {
        console.error('Erreur auto-refresh demandes:', e)
      } finally {
        isFetching = false
      }
    }, POLLING_INTERVAL_MS)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [filters])

  const openDetail  = (d: DocumentRequest) => { setSelected(d); setDetailOpen(true) }
  const closeDetail = useCallback(() => { setSelected(null); setDetailOpen(false) }, [])

  const handleAction = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selected) return
    const reference = selected.reference
    try {
      const res: any = await documentRequestService.transition(selected.id, { action, ...extra } as any)
      // Succès : fermeture de la fiche, rafraîchissement, puis modal central
      // de confirmation (reste affiché jusqu'au clic sur OK).
      closeDetail()
      void load()
      const fb = successFeedback(action, reference, res?.data?.status)
      await showSuccess(fb.title, fb.message)
    } catch (e: any) {
      // Échec : la fiche reste ouverte pour corriger ou réessayer ; le modal
      // explique simplement ce qui s'est passé.
      console.error('Erreur transition:', e?.message || e)
      await showError(FAILURE_TITLE, friendlyError(e) + "\nLe dossier n'a pas été modifié.")
      throw e
    }
  }, [selected, load, closeDetail])

  return {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail,
    handleAction, reload: load,
  }
}

export default useDemandesDashboard
