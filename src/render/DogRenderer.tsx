import type { DogConfig } from '../types'
import { composeSvg } from './composeSvg'

export function DogRenderer({ config, size = 320 }: { config: DogConfig; size?: number }) {
  const svg = composeSvg(config, { size })
  return (
    <div
      className="dog-render"
      style={{ width: '100%', maxWidth: size, aspectRatio: '1 / 1' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
