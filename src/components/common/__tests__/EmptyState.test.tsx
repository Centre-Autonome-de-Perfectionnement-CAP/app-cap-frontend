import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '../EmptyState'
import { cilInfo } from '@coreui/icons'

describe('EmptyState', () => {
  it('devrait afficher le titre et message par défaut', () => {
    render(<EmptyState />)
    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument()
    expect(screen.getByText(/Il n'y a aucune donnée à afficher/)).toBeInTheDocument()
  })

  it('devrait afficher un titre et message personnalisés', () => {
    const customTitle = 'Aucun étudiant'
    const customMessage = 'Aucun étudiant trouvé pour cette classe'
    
    render(<EmptyState title={customTitle} message={customMessage} />)
    
    expect(screen.getByText(customTitle)).toBeInTheDocument()
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('devrait afficher un bouton d\'action si fourni', () => {
    const actionLabel = 'Ajouter un étudiant'
    const onAction = vi.fn()
    
    render(<EmptyState actionLabel={actionLabel} onAction={onAction} />)
    
    const button = screen.getByRole('button', { name: actionLabel })
    expect(button).toBeInTheDocument()
  })

  it('devrait appeler onAction quand le bouton est cliqué', () => {
    const actionLabel = 'Ajouter'
    const onAction = vi.fn()
    
    render(<EmptyState actionLabel={actionLabel} onAction={onAction} />)
    
    const button = screen.getByRole('button', { name: actionLabel })
    fireEvent.click(button)
    
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('ne devrait pas afficher de bouton si actionLabel n\'est pas fourni', () => {
    const onAction = vi.fn()
    render(<EmptyState onAction={onAction} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('ne devrait pas afficher de bouton si onAction n\'est pas fourni', () => {
    render(<EmptyState actionLabel="Test" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('devrait appliquer une className personnalisée', () => {
    const { container } = render(<EmptyState className="custom-class" />)
    const card = container.querySelector('.custom-class')
    
    expect(card).toBeInTheDocument()
  })
})
