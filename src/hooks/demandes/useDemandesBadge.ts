// src/hooks/demandes/useDemandesBadge.ts
//
// Tâche 11.3 — Polling toutes les 60 secondes (pas de WebSocket disponible dans
// l'architecture actuelle Sanctum/Laravel). Le polling est la méthode utilisée.
//
// Pourquoi polling et non WebSocket ?
// → L'API utilise Sanctum (cookie-based auth), sans canal broadcast Laravel Echo
//   configuré. Le polling à 60 s est imperceptible pour l'utilisateur et ne charge
//   pas le serveur (1 requête COUNT/min = négligeable).
//
// Tâche 11.4 — Retourne `null` quand count === 0 (badge masqué côté vue)

import { useState, useEffect, useRef, useCallback } from 'react'
import HttpService from '@/services/http.service'

const POLL_INTERVAL_MS = 60_000  // 60 secondes

interface UsDemandesBadgeReturn {
  /** Nombre de dossiers en attente, ou null si 0 (badge masqué) */
  count: number | null
  /** true pendant le premier chargement uniquement */
  loading: boolean
  /** Force un rafraîchissement immédiat (ex: après une action dans le module) */
  refresh: () => void
}

/**
 * Retourne le compteur de dossiers en attente pour l'acteur connecté.
 * S'auto-rafraîchit toutes les 60 secondes (polling).
 * Retourne null quand count === 0 pour masquer le badge (tâche 11.4).
 */
export const useDemandesBadge = (): UsDemandesBadgeReturn => {
  const [count,   setCount]   = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCount = useCallback(async () => {
    try {
      const res = await HttpService.get('attestations/document-requests/badge-count')
      const n = res?.data?.count ?? 0
      // Tâche 11.4 : si 0, on stocke null pour masquer le badge
      setCount(n > 0 ? n : null)
    } catch {
      // Silencieux : on ne casse pas l'interface si l'endpoint est indisponible
      setCount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Premier appel immédiat
    fetchCount()

    // Polling toutes les 60 s (tâche 11.3)
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchCount])

  return { count, loading, refresh: fetchCount }
}