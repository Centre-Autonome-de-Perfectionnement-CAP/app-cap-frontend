// src/views/pages/demandes/hooks/useActionRunner.ts
// Hook partagé pour exécuter une action workflow avec :
//  - état loading
//  - toast d'erreur automatique (plus d'écran noir silencieux)
//  - message d'erreur local pour l'afficher dans la modal

import { useState, useCallback } from 'react'
import { useToast } from '@/contexts'

type ActionFn = (action: string, extra?: Record<string, unknown>) => Promise<void>

interface UseActionRunnerReturn {
  loadingAction: string | null
  errorMsg: string | null
  run: (action: string, extra?: Record<string, unknown>) => Promise<void>
  clearError: () => void
}

const useActionRunner = (onAction: ActionFn): UseActionRunnerReturn => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)
  const toast = useToast()

  const run = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    setLoadingAction(action)
    setErrorMsg(null)
    try {
      await onAction(action, extra)
    } catch (e: any) {
      const msg = e?.message || e?.error || 'Une erreur est survenue. Veuillez réessayer.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoadingAction(null)
    }
  }, [onAction, toast])

  return { loadingAction, errorMsg, run, clearError: () => setErrorMsg(null) }
}

export default useActionRunner
