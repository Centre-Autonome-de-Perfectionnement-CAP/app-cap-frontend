import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('devrait afficher le spinner avec le message par défaut', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Chargement des données...')).toBeInTheDocument()
  })

  it('devrait afficher un message personnalisé', () => {
    const customMessage = 'Chargement en cours...'
    render(<LoadingSpinner message={customMessage} />)
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('devrait afficher le spinner sans message si message est vide', () => {
    render(<LoadingSpinner message="" />)
    expect(screen.queryByText('Chargement des données...')).not.toBeInTheDocument()
  })

  it('devrait appliquer la classe fullPage si fullPage est true', () => {
    const { container } = render(<LoadingSpinner fullPage={true} />)
    const wrapper = container.querySelector('.d-flex.justify-content-center.align-items-center')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveStyle({ minHeight: '400px' })
  })

  it('ne devrait pas appliquer la classe fullPage par défaut', () => {
    const { container } = render(<LoadingSpinner />)
    const wrapper = container.querySelector('.d-flex.justify-content-center.align-items-center')
    expect(wrapper).not.toBeInTheDocument()
  })
})
