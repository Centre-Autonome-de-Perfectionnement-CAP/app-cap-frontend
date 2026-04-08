// src/views/pages/demandes/hooks/useDemandesDashboard.ts
// Hook partagé par tous les dashboards — centralise chargement, filtres, action, sélection.

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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await documentRequestService.getAll(filters)
      setDemandes(res.data || [])
    } catch (e) {
      console.error('Erreur chargement demandes:', e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const openDetail  = (d: DocumentRequest) => { setSelected(d); setDetailOpen(true) }
  const closeDetail = () => { setSelected(null); setDetailOpen(false) }

  const handleAction = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selected) return
    await documentRequestService.transition(selected.id, { action, ...extra } as any)
    closeDetail()
    await load()
  }, [selected, load])

  return { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction, reload: load }
}

export default useDemandesDashboard
