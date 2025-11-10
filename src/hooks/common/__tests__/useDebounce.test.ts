import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useDebounce from '../useDebounce'

describe('useDebounce', () => {
  it('devrait retourner la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebounce('initial', 100))
    expect(result.current).toBe('initial')
  })

  it('devrait debouncer les changements de valeur', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    )

    expect(result.current).toBe('initial')

    // Change la valeur
    rerender({ value: 'updated', delay: 100 })

    // La valeur ne doit pas changer immédiatement
    expect(result.current).toBe('initial')

    // Attendre que le debounce se termine
    await waitFor(() => {
      expect(result.current).toBe('updated')
    }, { timeout: 200 })
  })

  it('devrait annuler le debounce si la valeur change à nouveau', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      {
        initialProps: { value: 'initial' },
      }
    )

    // Change une première fois
    rerender({ value: 'first-update' })
    
    // Attendre un peu mais pas assez pour le debounce
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Change à nouveau avant la fin du délai
    rerender({ value: 'second-update' })

    // La première mise à jour doit être annulée
    await waitFor(() => {
      expect(result.current).toBe('second-update')
    }, { timeout: 300 })
  })

  it('devrait utiliser le délai par défaut de 500ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    )

    rerender({ value: 'updated' })

    await waitFor(() => {
      expect(result.current).toBe('updated')
    }, { timeout: 600 })
  })

  it('devrait fonctionner avec différents types de valeurs', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: 0 },
      }
    )

    rerender({ value: 42 })

    await waitFor(() => {
      expect(result.current).toBe(42)
    }, { timeout: 200 })
  })

  it('devrait fonctionner avec des objets', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: { name: 'initial' } },
      }
    )

    const newValue = { name: 'updated' }
    rerender({ value: newValue })

    await waitFor(() => {
      expect(result.current).toEqual(newValue)
    }, { timeout: 200 })
  })
})
