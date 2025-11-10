import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../Pagination'

describe('Pagination', () => {
  it('ne devrait pas s\'afficher si totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('devrait afficher les boutons Précédent et Suivant', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />)
    
    expect(screen.getByLabelText('Précédent')).toBeInTheDocument()
    expect(screen.getByLabelText('Suivant')).toBeInTheDocument()
  })

  it('devrait désactiver le bouton Précédent sur la première page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    
    const prevButton = screen.getByLabelText('Précédent')
    expect(prevButton).toHaveClass('disabled')
  })

  it('devrait désactiver le bouton Suivant sur la dernière page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />)
    
    const nextButton = screen.getByLabelText('Suivant')
    expect(nextButton).toHaveClass('disabled')
  })

  it('devrait appeler onPageChange avec la page précédente', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
    
    const prevButton = screen.getByLabelText('Précédent')
    fireEvent.click(prevButton)
    
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('devrait appeler onPageChange avec la page suivante', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
    
    const nextButton = screen.getByLabelText('Suivant')
    fireEvent.click(nextButton)
    
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('devrait appeler onPageChange avec le numéro de page cliqué', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    
    const pageButton = screen.getByText('3')
    fireEvent.click(pageButton)
    
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('devrait marquer la page actuelle comme active', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />)
    
    const activePageButton = screen.getByText('3').closest('li')
    expect(activePageButton).toHaveClass('active')
  })

  it('devrait afficher des ellipsis pour de nombreuses pages', () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />)
    
    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThan(0)
  })

  it('devrait afficher la première et la dernière page', () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('devrait limiter le nombre de pages visibles', () => {
    const { container } = render(
      <Pagination currentPage={10} totalPages={100} onPageChange={vi.fn()} maxVisible={5} />
    )
    
    // On s'attend à voir: 1, ..., 8, 9, 10, 11, 12, ..., 100
    // Plus les boutons Précédent et Suivant
    const buttons = container.querySelectorAll('.page-item')
    // Devrait être raisonnable (pas 100 boutons)
    expect(buttons.length).toBeLessThan(15)
  })
})
