import type { DogConfig } from '../types'
import { decodeConfig } from '../share/configCodec'
import { loadConfig } from '../storage/persistence'
import { defaultConfig } from '../catalog/config'

export function resolveInitialConfig(hash: string, storage?: Storage): DogConfig {
  const match = hash.match(/dog=([^&]+)/)
  if (match) return decodeConfig(decodeURIComponent(match[1]))
  const stored = loadConfig(storage)
  if (stored) return stored
  return defaultConfig()
}
