// src/catalog/parts.test.ts
import { describe, it, expect } from 'vitest'
import { PARTS } from './parts'

describe('parts', () => {
  it('body fragments use currentColor (recolorable)', () => {
    expect(PARTS.bodyClassic).toContain('fill="currentColor"')
  })
  it('face fragments use fixed ink color', () => {
    expect(PARTS.eyesDots).toContain('#2e2018')
    expect(PARTS.eyesDots).not.toContain('currentColor')
  })
})
