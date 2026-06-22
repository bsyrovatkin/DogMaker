// src/catalog/index.test.ts
import { describe, it, expect } from 'vitest'
import {
  catalog, CATEGORY_KEYS, LAYER_CATEGORY_KEYS,
  getOption, colorHex, sizeScale,
} from './index'

describe('catalog', () => {
  it('has a category for every key, each with options', () => {
    for (const key of CATEGORY_KEYS) {
      const cat = catalog.find((c) => c.key === key)
      expect(cat, `missing category ${key}`).toBeTruthy()
      expect(cat!.options.length).toBeGreaterThan(0)
    }
  })

  it('option ids are unique within each category', () => {
    for (const cat of catalog) {
      const ids = cat.options.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('layer categories are ordered by zIndex and carry svg', () => {
    const zs = LAYER_CATEGORY_KEYS.map(
      (k) => catalog.find((c) => c.key === k)!.zIndex!,
    )
    expect([...zs]).toEqual([...zs].sort((a, b) => a - b))
    for (const k of LAYER_CATEGORY_KEYS) {
      expect(catalog.find((c) => c.key === k)!.options[0].svg).toBeTruthy()
    }
  })

  it('getOption falls back to the first option for an unknown id', () => {
    const first = catalog.find((c) => c.key === 'ears')!.options[0]
    expect(getOption('ears', 'does-not-exist')).toBe(first)
  })

  it('colorHex resolves palette ids and hex: custom values', () => {
    expect(colorHex({ ...base(), color: 'col-classic' })).toMatch(/^#/)
    expect(colorHex({ ...base(), color: 'hex:abcdef' })).toBe('#abcdef')
  })

  it('sizeScale returns the option scale', () => {
    expect(sizeScale({ ...base(), size: 'size-normal' })).toBe(1)
  })
})

function base() {
  return {
    bodyType: 'body-classic', size: 'size-normal', fur: 'fur-short',
    color: 'col-classic', ears: 'ears-floppy', eyes: 'eyes-dots',
    nose: 'nose-oval', mouth: 'mouth-smile', accessory: 'acc-none',
  }
}
