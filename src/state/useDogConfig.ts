import { useCallback, useEffect, useState } from 'react'
import type { CategoryKey, DogConfig } from '../types'
import { resolveInitialConfig } from './resolveInitialConfig'
import { saveConfig } from '../storage/persistence'
import { randomConfig } from '../catalog/config'
import { encodeConfig } from '../share/configCodec'

export function useDogConfig() {
  const [config, setConfig] = useState<DogConfig>(() =>
    resolveInitialConfig(typeof window !== 'undefined' ? window.location.hash : ''),
  )

  useEffect(() => {
    saveConfig(config)
  }, [config])

  const select = useCallback((key: CategoryKey, id: string) => {
    setConfig((c) => ({ ...c, [key]: id }))
  }, [])

  const randomize = useCallback(() => {
    setConfig(randomConfig())
  }, [])

  const shareUrl = useCallback(() => {
    const base = window.location.href.split('#')[0]
    return `${base}#dog=${encodeURIComponent(encodeConfig(config))}`
  }, [config])

  return { config, select, randomize, shareUrl }
}
