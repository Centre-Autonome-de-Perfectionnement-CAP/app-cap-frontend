import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useModal from '../useModal'

describe('useModal', () => {
  it('devrait initialiser avec isOpen à false par défaut', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.isOpen).toBe(false)
  })

  it('devrait initialiser avec la valeur fournie', () => {
    const { result } = renderHook(() => useModal(true))
    expect(result.current.isOpen).toBe(true)
  })

  it('devrait ouvrir le modal avec open()', () => {
    const { result } = renderHook(() => useModal(false))

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('devrait fermer le modal avec close()', () => {
    const { result } = renderHook(() => useModal(true))

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('devrait toggle le modal', () => {
    const { result } = renderHook(() => useModal(false))

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('devrait garder les mêmes références de fonctions', () => {
    const { result, rerender } = renderHook(() => useModal())

    const openRef = result.current.open
    const closeRef = result.current.close
    const toggleRef = result.current.toggle

    rerender()

    expect(result.current.open).toBe(openRef)
    expect(result.current.close).toBe(closeRef)
    expect(result.current.toggle).toBe(toggleRef)
  })

  it('devrait permettre plusieurs appels successifs', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.open()
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })
})
