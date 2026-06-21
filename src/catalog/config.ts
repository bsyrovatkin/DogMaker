import type { DogConfig } from '../types'
import { CATEGORY_KEYS, getCategory, isValidOptionId } from './index'

export function defaultConfig(): DogConfig {
  const cfg = {} as DogConfig
  for (const k of CATEGORY_KEYS) cfg[k] = getCategory(k).options[0].id
  return cfg
}

export function sanitizeConfig(partial: Partial<Record<keyof DogConfig, string>>): DogConfig {
  const cfg = defaultConfig()
  for (const k of CATEGORY_KEYS) {
    const v = partial[k]
    if (typeof v === 'string' && isValidOptionId(k, v)) cfg[k] = v
  }
  return cfg
}

export function randomConfig(): DogConfig {
  const cfg = {} as DogConfig
  for (const k of CATEGORY_KEYS) {
    const opts = getCategory(k).options
    cfg[k] = opts[Math.floor(Math.random() * opts.length)].id
  }
  return cfg
}
