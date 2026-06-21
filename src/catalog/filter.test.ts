// src/catalog/filter.test.ts
import { describe, it, expect } from 'vitest'
import { FILTER_DEFS, FILTER_ID } from './filter'

describe('filter', () => {
  it('exposes a filter id used inside the defs', () => {
    expect(FILTER_ID).toBe('dm-rough')
    expect(FILTER_DEFS).toContain('id="dm-rough"')
    expect(FILTER_DEFS).toContain('feTurbulence')
    expect(FILTER_DEFS).toContain('feDisplacementMap')
  })
})
