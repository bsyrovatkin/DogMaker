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
    expect(swatch.style.background).toMatch(/#123456/i)
  })

  it('renders a label for a size option', () => {
    const { getByText } = render(
      <OptionThumb categoryKey="size" option={{ id: 's', label: 'Big', scale: 1.1 }} />,
    )
    expect(getByText('Big')).toBeTruthy()
  })

  it('renders an svg for a part option', () => {
    const { container } = render(
      <OptionThumb categoryKey="ears" option={{ id: 'e', label: 'E', svg: '<circle cx="64" cy="80" r="16" fill="currentColor"/>' }} />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
