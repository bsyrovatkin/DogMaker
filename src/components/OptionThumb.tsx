import type { CategoryKey, Option } from '../types'
import { composeSvg } from '../render/composeSvg'
import { defaultConfig } from '../catalog/config'

// Small facial features read better cropped to the face than shown on the whole dog.
const FACE_CATEGORIES = new Set<CategoryKey>(['eyes', 'nose', 'mouth'])
const FACE_VIEWBOX = '46 44 108 108'

export function OptionThumb({ categoryKey, option }: { categoryKey: CategoryKey; option: Option }) {
  if (categoryKey === 'color') {
    return <span className="swatch" style={{ background: option.color }} />
  }
  if (categoryKey === 'size') {
    return <span className="size-label">{option.label}</span>
  }
  // Preview the real composited dog with just this option swapped in, so the tile
  // shows exactly what the option produces. Face features are cropped to the head.
  const config = { ...defaultConfig(), [categoryKey]: option.id }
  const viewBox = FACE_CATEGORIES.has(categoryKey) ? FACE_VIEWBOX : undefined
  const svg = composeSvg(config, { viewBox })
  return <span className="thumb-svg" dangerouslySetInnerHTML={{ __html: svg }} />
}
