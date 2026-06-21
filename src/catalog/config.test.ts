// src/catalog/config.test.ts
import { describe, it, expect } from 'vitest'
import { defaultConfig, sanitizeConfig, randomConfig } from './config'
import { CATEGORY_KEYS, isValidOptionId } from './index'

describe('config helpers', () => {
  it('defaultConfig is valid for every category', () => {
    const cfg = defaultConfig()
    for (const k of CATEGORY_KEYS) expect(isValidOptionId(k, cfg[k])).toBe(true)
  })

  it('defaultConfig uses size-normal, not size-tiny', () => {
    expect(defaultConfig().size).toBe('size-normal')
  })

  it('sanitizeConfig replaces unknown ids with defaults but keeps valid ones', () => {
    const cfg = sanitizeConfig({ ears: 'ears-pointy', nose: 'bogus' })
    expect(cfg.ears).toBe('ears-pointy')
    expect(cfg.nose).toBe(defaultConfig().nose)
  })

  it('sanitizeConfig accepts a custom hex color', () => {
    expect(sanitizeConfig({ color: 'hex:123abc' }).color).toBe('hex:123abc')
  })

  it('randomConfig produces a valid config', () => {
    for (let i = 0; i < 20; i++) {
      const cfg = randomConfig()
      for (const k of CATEGORY_KEYS) expect(isValidOptionId(k, cfg[k])).toBe(true)
    }
  })
})
