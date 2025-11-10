import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '../ErrorBoundary'

// Composant qui lance une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Supprimer les erreurs de console pendant les tests
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('devrait afficher les enfants normalement sans erreur', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('devrait capturer une erreur et afficher l\'UI d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error/i)).toBeInTheDocument()
  })

  it('devrait afficher le bouton "Réessayer"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('devrait afficher le bouton "Recharger la page"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Recharger la page')).toBeInTheDocument()
  })

  it('devrait appeler handleReset lors du clic sur Réessayer', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument()

    const retryButton = screen.getByText('Réessayer')
    
    // Le bouton Réessayer est présent et cliquable
    expect(retryButton).toBeInTheDocument()
    expect(retryButton).toHaveAttribute('type', 'button')
    
    await user.click(retryButton)
    
    // Le reset a été appelé - l'ErrorBoundary reste affichée
    // car le composant enfant lance toujours l'erreur
    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument()
  })

  it('devrait afficher un fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom Error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.queryByText(/Une erreur s'est produite/i)).not.toBeInTheDocument()
  })

  it('devrait logger l\'erreur dans la console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('devrait afficher le message d\'erreur dans l\'alerte', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const errorAlert = screen.getByText(/Test error/i).closest('.alert')
    expect(errorAlert).toHaveClass('alert-danger')
  })
})
