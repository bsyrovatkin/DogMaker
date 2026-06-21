// src/state/resolveInitialConfig.test.ts
import { describe, it, expect } from 'vitest'
import { resolveInitialConfig } from './resolveInitialConfig'
import { defaultConfig } from '../catalog/config'
import { encodeConfig } from '../share/configCodec'
import { saveConfig } from '../storage/persistence'

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size },
  } as Storage
}

describe('resolveInitialConfig', () => {
  it('prefers a config in the hash', () => {
    const shared = { ...defaultConfig(), ears: 'ears-pointy' }
    const cfg = resolveInitialConfig(`#dog=${encodeConfig(shared)}`, fakeStorage())
    expect(cfg.ears).toBe('ears-pointy')
  })

  it('falls back to stored config when no hash', () => {
    const s = fakeStorage()
    saveConfig({ ...defaultConfig(), eyes: 'eyes-sparkle' }, s)
    expect(resolveInitialConfig('', s).eyes).toBe('eyes-sparkle')
  })

  it('falls back to defaults when nothing is available', () => {
    expect(resolveInitialConfig('', fakeStorage())).toEqual(defaultConfig())
  })
})
