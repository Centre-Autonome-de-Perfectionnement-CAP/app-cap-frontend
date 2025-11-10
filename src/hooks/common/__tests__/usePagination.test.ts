import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePagination from '../usePagination'

describe('usePagination', () => {
  it('devrait initialiser avec les valeurs par défaut', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.currentPage).toBe(1)
    expect(result.current.itemsPerPage).toBe(10)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.canGoNext).toBe(false)
    expect(result.current.canGoPrevious).toBe(false)
  })

  it('devrait initialiser avec les valeurs fournies', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 3,
        itemsPerPage: 20,
        totalItems: 100,
      })
    )

    expect(result.current.currentPage).toBe(3)
    expect(result.current.itemsPerPage).toBe(20)
    expect(result.current.totalPages).toBe(5)
  })

  it('devrait calculer correctement totalPages', () => {
    const { result } = renderHook(() =>
      usePagination({
        itemsPerPage: 10,
        totalItems: 95,
      })
    )

    expect(result.current.totalPages).toBe(10) // Math.ceil(95 / 10)
  })

  it('devrait calculer startIndex et endIndex', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 2,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    expect(result.current.startIndex).toBe(10) // (2 - 1) * 10
    expect(result.current.endIndex).toBe(20) // min(10 + 10, 50)
  })

  it('devrait aller à la page suivante', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 1,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('ne devrait pas dépasser la dernière page', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 5,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(5)
    expect(result.current.canGoNext).toBe(false)
  })

  it('devrait aller à la page précédente', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 3,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('ne devrait pas aller en dessous de la page 1', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 1,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.currentPage).toBe(1)
    expect(result.current.canGoPrevious).toBe(false)
  })

  it('devrait aller à une page spécifique', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 1,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.goToPage(3)
    })

    expect(result.current.currentPage).toBe(3)
  })

  it('devrait valider le numéro de page lors de goToPage', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 1,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    // Essayer d'aller à une page trop haute
    act(() => {
      result.current.goToPage(10)
    })
    expect(result.current.currentPage).toBe(5) // Max pages

    // Essayer d'aller à une page négative
    act(() => {
      result.current.goToPage(-1)
    })
    expect(result.current.currentPage).toBe(1) // Min page
  })

  it('devrait changer itemsPerPage et reset à la page 1', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 3,
        itemsPerPage: 10,
        totalItems: 100,
      })
    )

    expect(result.current.currentPage).toBe(3)

    act(() => {
      result.current.setItemsPerPage(20)
    })

    expect(result.current.itemsPerPage).toBe(20)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(5) // 100 / 20
  })

  it('devrait reset à la page initiale', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 2,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    act(() => {
      result.current.goToPage(5)
    })
    expect(result.current.currentPage).toBe(5)

    act(() => {
      result.current.reset()
    })
    expect(result.current.currentPage).toBe(2)
  })

  it('devrait gérer canGoNext et canGoPrevious correctement', () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 2,
        itemsPerPage: 10,
        totalItems: 50,
      })
    )

    expect(result.current.canGoNext).toBe(true)
    expect(result.current.canGoPrevious).toBe(true)

    // Va à la première page
    act(() => {
      result.current.goToPage(1)
    })
    expect(result.current.canGoNext).toBe(true)
    expect(result.current.canGoPrevious).toBe(false)

    // Va à la dernière page
    act(() => {
      result.current.goToPage(5)
    })
    expect(result.current.canGoNext).toBe(false)
    expect(result.current.canGoPrevious).toBe(true)
  })

  it('devrait gérer le cas où totalItems est 0', () => {
    const { result } = renderHook(() =>
      usePagination({
        itemsPerPage: 10,
        totalItems: 0,
      })
    )

    expect(result.current.totalPages).toBe(1)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(0)
  })
})
