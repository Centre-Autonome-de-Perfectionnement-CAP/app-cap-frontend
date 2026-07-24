// src/views/pages/demandes/hooks/useDemandesDashboard.ts

import { useState, useEffect, useCallback } from 'react'
import documentRequestService from '@/services/document-request.service'
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

  // Intelligent polling every 2 seconds (silent background refresh)
  useEffect(() => {
    let isMounted = true
    let isFetching = false

    const interval = setInterval(async () => {
      if (isFetching) return
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
    }, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [filters])

  const openDetail  = (d: DocumentRequest) => { setSelected(d); setDetailOpen(true) }
  const closeDetail = useCallback(() => { setSelected(null); setDetailOpen(false) }, [])

  const handleAction = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selected) return
    try {
      await documentRequestService.transition(selected.id, { action, ...extra } as any)
      // Succès : ferme la modal et rafraîchit
      closeDetail()
      await load()
    } catch (e: any) {
      // Échec : on laisse la modal ouverte pour que l'utilisateur voie l'erreur
      // et puisse réessayer. Le composant parent affichera l'erreur via console.
      console.error('Erreur transition:', e?.message || e)
      // On propage l'erreur pour que le dashboard local puisse l'afficher si besoin
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
