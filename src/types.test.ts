// src/types.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type { DogConfig, CategoryKey } from './types'

describe('types', () => {
  it('DogConfig has a string for every category key', () => {
    const cfg: DogConfig = {
      bodyType: 'a', size: 'a', fur: 'a', color: 'a',
      ears: 'a', eyes: 'a', nose: 'a', mouth: 'a', accessory: 'a',
    }
    expectTypeOf(cfg).toMatchTypeOf<Record<CategoryKey, string>>()
  })
})
