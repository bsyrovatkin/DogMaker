import type { DogConfig } from '../types'
import { sanitizeConfig } from '../catalog/config'

const KEY = 'dogmaker.config.v1'

export function saveConfig(config: DogConfig, storage: Storage = localStorage): void {
  try {
    storage.setItem(KEY, JSON.stringify(config))
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function loadConfig(storage: Storage = localStorage): DogConfig | null {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return null
    return sanitizeConfig(JSON.parse(raw))
  } catch {
    return null
  }
}
