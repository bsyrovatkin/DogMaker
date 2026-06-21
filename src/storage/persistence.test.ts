// src/storage/persistence.test.ts
import { describe, it, expect } from 'vitest'
import { saveConfig, loadConfig } from './persistence'
import { defaultConfig } from '../catalog/config'

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

describe('persistence', () => {
  it('returns null when nothing is stored', () => {
    expect(loadConfig(fakeStorage())).toBeNull()
  })

  it('saves and loads a sanitized config', () => {
    const s = fakeStorage()
    const cfg = { ...defaultConfig(), ears: 'ears-round' }
    saveConfig(cfg, s)
    expect(loadConfig(s)).toEqual(cfg)
  })

  it('survives corrupt stored data', () => {
    const s = fakeStorage()
    s.setItem('dogmaker.config.v1', '{not json')
    expect(loadConfig(s)).toBeNull()
  })
})
