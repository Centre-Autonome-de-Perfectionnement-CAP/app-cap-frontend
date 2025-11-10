import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from '../Avatar'

describe('Avatar', () => {
  it('devrait afficher une image si src est fourni', () => {
    const { container } = render(<Avatar src="https://example.com/avatar.jpg" />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('devrait afficher l\'icône par défaut si src est null', () => {
    const { container } = render(<Avatar src={null} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('devrait afficher l\'icône par défaut si src n\'est pas fourni', () => {
    const { container } = render(<Avatar />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('devrait appliquer la taille sm', () => {
    const { container } = render(<Avatar size="sm" />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('devrait appliquer la taille md par défaut', () => {
    const { container } = render(<Avatar />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('devrait appliquer la taille lg', () => {
    const { container } = render(<Avatar size="lg" />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveStyle({ width: '56px', height: '56px' })
  })

  it('devrait appliquer la taille xl', () => {
    const { container } = render(<Avatar size="xl" />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveStyle({ width: '72px', height: '72px' })
  })

  it('devrait appliquer la forme rounded-circle par défaut', () => {
    const { container } = render(<Avatar />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveClass('rounded-circle')
  })

  it('devrait appliquer la forme rounded', () => {
    const { container } = render(<Avatar shape="rounded" />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveClass('rounded')
  })

  it('devrait appliquer les classes personnalisées', () => {
    const { container } = render(<Avatar className="custom-class" />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveClass('custom-class')
  })

  it('devrait avoir des couleurs par défaut pour l\'avatar sans image', () => {
    const { container } = render(<Avatar />)
    const avatar = container.querySelector('.avatar')
    expect(avatar).toHaveClass('bg-secondary')
    expect(avatar).toHaveClass('text-white')
  })
})
