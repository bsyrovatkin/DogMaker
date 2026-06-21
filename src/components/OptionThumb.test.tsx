// src/components/OptionThumb.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { OptionThumb } from './OptionThumb'

describe('OptionThumb', () => {
  it('renders a swatch for a color option', () => {
    const { container } = render(
      <OptionThumb categoryKey="color" option={{ id: 'c', label: 'C', color: '#123456' }} />,
    )
    const swatch = container.querySelector('.swatch') as HTMLElement
    expect(swatch).toBeTruthy()
    expect(swatch.style.background).toContain('rgb(18, 52, 86)')
  })

  it('renders a label for a size option', () => {
    const { getByText } = render(
      <OptionThumb categoryKey="size" option={{ id: 's', label: 'Big', scale: 1.1 }} />,
    )
    expect(getByText('Big')).toBeTruthy()
  })

  it('previews the composed dog at full frame for a body/ears part', () => {
    const { container } = render(
      <OptionThumb categoryKey="ears" option={{ id: 'ears-round', label: 'Round' }} />,
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('viewBox')).toBe('-30 -10 260 260')
  })

  it('crops the thumbnail to the face for eyes/nose/mouth', () => {
    const { container } = render(
      <OptionThumb categoryKey="eyes" option={{ id: 'eyes-dots', label: 'Dots' }} />,
    )
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('viewBox')).toBe('46 44 108 108')
  })
})
