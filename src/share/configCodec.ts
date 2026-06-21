import type { DogConfig } from '../types'
import { CATEGORY_KEYS } from '../catalog'
import { sanitizeConfig } from '../catalog/config'

const SEP = '~'

export function encodeConfig(config: DogConfig): string {
  return CATEGORY_KEYS.map((k) => config[k]).join(SEP)
}

export function decodeConfig(str: string): DogConfig {
  const parts = str.split(SEP)
  const partial: Partial<Record<keyof DogConfig, string>> = {}
  CATEGORY_KEYS.forEach((k, i) => {
    if (parts[i]) partial[k] = parts[i]
  })
  return sanitizeConfig(partial)
}
