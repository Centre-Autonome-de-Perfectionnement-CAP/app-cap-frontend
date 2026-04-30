// src/views/pages/demandes/hooks/useDirectionStats.ts
//
// Hook partagé par les 4 rôles direction.
// Calcule les compteurs affichés dans les StatCards à partir des demandes déjà chargées
// (pas d'appel API supplémentaire — les demandes viennent de useDemandesDashboard).
//
// RÈGLE : les acteurs direction ne voient QUE leur statut propre dans le listing.
// Donc :
//   - pendingAtMyLevel  = total des demandes listées (toutes sont à leur niveau)
//   - inCircuit         = celles avec is_in_correction_circuit = true
//   - hasFlag           = celles avec has_flag = true
//   - Les totaux circuit global viennent de l'endpoint stats si disponible

import { useEffect, useState, useCallback } from 'react'
import documentRequestService from '@/services/document-request.service'
import type { DocumentRequest } from '@/types/document-request.types'

export interface DirectionStatsData {
  pendingAtMyLevel: number
  inCircuit: number         // dossiers en navette chez cet acteur
  hasFlag: number           // dossiers avec réserve active
  totalInProgress: number   // total global en circulation (depuis API stats)
  totalValidated: number    // total validé/transmis (depuis API stats)
  totalRejected: number     // total rejeté (depuis API stats)
}

export const useDirectionStats = (demandes: DocumentRequest[]) => {
  const [apiStats, setApiStats] = useState<{
    total_in_progress: number
    total_validated: number
    total_rejected: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      // @ts-ignore — getStats existe sur le service mais pas encore typé
      const res = await documentRequestService.getStats?.()
      setApiStats(res?.data ?? null)
    } catch {
      setApiStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [demandes.length, fetchStats])

  const stats: DirectionStatsData = {
    pendingAtMyLevel: demandes.length,
    inCircuit:        demandes.filter(d => !!d.is_in_correction_circuit).length,
    hasFlag:          demandes.filter(d => !!d.has_flag).length,
    totalInProgress:  apiStats?.total_in_progress  ?? 0,
    totalValidated:   apiStats?.total_validated    ?? 0,
    totalRejected:    apiStats?.total_rejected     ?? 0,
  }

  return { stats, statsLoading }
}
