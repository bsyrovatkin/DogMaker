import type { CategoryKey, Option } from '../types'
import { FILTER_DEFS } from '../catalog/filter'

const THUMB_COLOR = '#c98a5e'

export function OptionThumb({ categoryKey, option }: { categoryKey: CategoryKey; option: Option }) {
  if (categoryKey === 'color') {
    return <span className="swatch" style={{ background: option.color }} />
  }
  if (categoryKey === 'size') {
    return <span className="size-label">{option.label}</span>
  }
  // svg part: show the fragment alone, in a mini frame
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -10 260 260" width="100%" height="100%">` +
    `<defs>${FILTER_DEFS}</defs>` +
    `<g filter="url(#dm-rough)" stroke="#2e2018" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">` +
    `<g style="color:${THUMB_COLOR}">${option.svg ?? ''}</g></g></svg>`
  return <span className="thumb-svg" dangerouslySetInnerHTML={{ __html: svg }} />
}
