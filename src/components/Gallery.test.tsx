// src/components/Gallery.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Gallery } from './Gallery'

describe('Gallery', () => {
  it('renders multiple dog previews', () => {
    const { container } = render(<Gallery />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(5)
  })
})
