// src/share/configCodec.test.ts
import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig } from './configCodec'
import { defaultConfig } from '../catalog/config'

describe('configCodec', () => {
  it('round-trips a config losslessly', () => {
    const cfg = { ...defaultConfig(), ears: 'ears-pointy', color: 'hex:abcdef' }
    expect(decodeConfig(encodeConfig(cfg))).toEqual(cfg)
  })

  it('encodes without URL-hostile characters', () => {
    const s = encodeConfig(defaultConfig())
    expect(s).not.toMatch(/[#&?]/)
  })

  it('tolerates a malformed string by falling back to defaults', () => {
    expect(decodeConfig('garbage')).toEqual(defaultConfig())
    expect(decodeConfig('')).toEqual(defaultConfig())
  })
})
