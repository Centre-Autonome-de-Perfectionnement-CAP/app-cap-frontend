import { useState, useCallback, useEffect, useRef } from 'react'

interface UseAsyncState<T> {
  loading: boolean
  error: Error | null
  data: T | null
}

interface UseAsyncReturn<T, Args extends any[]> extends UseAsyncState<T> {
  execute: (...args: Args) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
}

/**
 * Hook useAsync - Gère les opérations asynchrones avec état loading/error/data
 * @param asyncFunction - Fonction asynchrone à exécuter
 * @param immediate - Exécuter immédiatement au montage (par défaut false)
 * @returns Objet contenant l'état et les handlers
 */
function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  })
  const asyncFunctionRef = useRef(asyncFunction)

  useEffect(() => {
    asyncFunctionRef.current = asyncFunction
  }, [asyncFunction])

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setState({ loading: true, error: null, data: null })

    try {
      const response = await asyncFunctionRef.current(...args)
      setState({ loading: false, error: null, data: response })
      return response
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      setState({ loading: false, error: errorObj, data: null })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    execute,
    reset,
    setData,
  }
}

export default useAsync
