// src/render/DogRenderer.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DogRenderer } from './DogRenderer'
import { defaultConfig } from '../catalog/config'

describe('DogRenderer', () => {
  it('renders an svg for the config', () => {
    const { container } = render(<DogRenderer config={defaultConfig()} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('viewBox')).toBe('-30 -10 260 260')
  })
})
