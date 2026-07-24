// src/hooks/demandes/useDemandesBadge.ts
//
// Polling toutes les 60 secondes.
//
// CORRECTION : l'endpoint badge-count côté backend ne comptait que les dossiers
// dont le statut est "submitted" (nouvelles demandes). Or la secrétaire doit aussi
// voir les dossiers au statut "secretary_final_review" (À finaliser après signature
// du Directeur) dans son badge portail.
//
// Solution : l'endpoint renvoie maintenant soit un entier simple (ancien format),
// soit un objet { count, breakdown: { submitted, secretary_final_review, … } }.
// Le hook additionne les deux cas pour produire le total affiché.
// Si l'endpoint renvoie toujours un entier, on l'utilise tel quel (rétrocompat).

import { useState, useEffect, useRef, useCallback } from 'react'
import HttpService from '@/services/http.service'

const POLL_INTERVAL_MS = 60_000  // 60 secondes

interface UsDemandesBadgeReturn {
  /** Nombre de dossiers en attente, ou null si 0 (badge masqué) */
  count: number | null
  /** true pendant le premier chargement uniquement */
  loading: boolean
  /** Force un rafraîchissement immédiat */
  refresh: () => void
}

/**
 * Retourne le compteur de dossiers en attente pour l'acteur connecté.
 * S'auto-rafraîchit toutes les 60 secondes (polling).
 * Retourne null quand count === 0 pour masquer le badge.
 *
 * Pour la secrétaire, additionne :
 *   - `submitted`              (nouvelles demandes)
 *   - `secretary_final_review` (À finaliser après signature Directeur)
 *   - `secretary_correction`   (À corriger — circuit de correction)
 *
 * Pour les autres acteurs, utilise le total renvoyé par l'endpoint.
 */
export const useDemandesBadge = (): UsDemandesBadgeReturn => {
  const [count,   setCount]   = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCount = useCallback(async () => {
    try {
      const res = await HttpService.get('attestations/document-requests/badge-count')
      const data = res?.data

      let n = 0

      if (data && typeof data === 'object') {
        // Format étendu : { count, breakdown: { submitted, secretary_final_review, … } }
        if (typeof data.count === 'number') {
          n = data.count
          // Si le backend renvoie un breakdown, additionner les statuts
          // "secrétaire" explicitement pour s'assurer que secretary_final_review
          // est bien compté (certaines versions backend l'omettent).
          if (data.breakdown && typeof data.breakdown === 'object') {
            const b = data.breakdown as Record<string, number>
            // Total = tous les statuts du breakdown (évite double-comptage)
            n = Object.values(b).reduce((sum, v) => sum + (v || 0), 0)
          }
        } else if (typeof data === 'number') {
          n = data
        }
      } else if (typeof data === 'number') {
        n = data
      }

      setCount(n > 0 ? n : null)
    } catch {
      // Silencieux
      setCount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount()
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchCount])

  return { count, loading, refresh: fetchCount }
}
