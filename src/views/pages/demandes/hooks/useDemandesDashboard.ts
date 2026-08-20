// src/views/pages/demandes/hooks/useDemandesDashboard.ts
// CORRECTIF écran noir :
//  - handleAction ne ferme la modal QUE si la transition réussit
//  - closeDetail : délai porté à 350ms + reset propre
//  - Polling porté à 10s pour éviter la surcharge + on stoppe si la modal est ouverte

import { useState, useEffect, useCallback, useRef } from 'react'
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
  reload: (silent?: boolean) => Promise<void>
}

const useDemandesDashboard = (initialFilters: Filters = {}): UseDemandesDashboardReturn => {
  const [demandes,   setDemandes]   = useState<DocumentRequest[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filters,    setFilters]    = useState<Filters>(initialFilters)
  const [selected,   setSelected]   = useState<DocumentRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // ref pour savoir si une modal est ouverte → on suspend le polling
  const detailOpenRef = useRef(false)
  detailOpenRef.current = detailOpen

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await documentRequestService.getAll(filters)
      const list = res.data || []
      setDemandes(list)
      // Rafraîchit la demande sélectionnée sans la fermer
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

  // Chargement initial
  useEffect(() => {
    load(false)
  }, [load])

  // Polling silencieux toutes les 10s — suspendu quand une modal est ouverte
  useEffect(() => {
    let isMounted = true
    let isFetching = false

    const interval = setInterval(async () => {
      // Ne pas rafraîchir si l'utilisateur est en train d'interagir avec une modal
      if (detailOpenRef.current) return
      if (isFetching) return
      isFetching = true
      try {
        const res = await documentRequestService.getAll(filters)
        if (isMounted) {
          const list = res.data || []
          setDemandes(list)
          // Ne met pas à jour selected pendant le polling pour éviter les race conditions
        }
      } catch (e) {
        // Silencieux
      } finally {
        isFetching = false
      }
    }, 10000) // 10 secondes — moins agressif

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [filters])

  const openDetail = useCallback((d: DocumentRequest) => {
    setSelected(d)
    setDetailOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    // On ferme d'abord (animation CoreUI) puis on nettoie après 400ms
    setDetailOpen(false)
    setTimeout(() => setSelected(null), 400)
  }, [])

  const handleAction = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selected) return
    // On ne ferme PAS la modal avant que la transition réussisse
    await documentRequestService.transition(selected.id, { action, ...extra } as any)
    // Succès : ferme la modal et rafraîchit
    closeDetail()
    // Délai pour laisser l'animation de fermeture se terminer avant le reload
    await new Promise(r => setTimeout(r, 420))
    await load(false)
  }, [selected, load, closeDetail])

  return {
    demandes, loading, filters, setFilters,
    selected, detailOpen, openDetail, closeDetail,
    handleAction, reload: (silent = false) => load(silent),
  }
}

export default useDemandesDashboard
