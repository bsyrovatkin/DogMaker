import type { DogConfig } from '../types'
import { FILTER_DEFS } from '../catalog/filter'
import { colorHex, getOption, LAYER_CATEGORY_KEYS, sizeScale } from '../catalog'

export interface ComposeOptions {
  /** Output pixel width and height (square). Default 512. */
  size?: number
  /** SVG viewBox override — e.g. to crop a thumbnail to the face. Defaults to the whole dog. */
  viewBox?: string
}

const FULL_VIEWBOX = '-30 -10 260 260'

export function composeSvg(config: DogConfig, options: ComposeOptions = {}): string {
  const size = options.size ?? 512
  const viewBox = options.viewBox ?? FULL_VIEWBOX
  const color = colorHex(config)
  const scale = sizeScale(config)
  const body = LAYER_CATEGORY_KEYS
    .map((key) => getOption(key, config[key]).svg ?? '')
    .join('')

  // The accessory sits either behind the dog (wings) or on top of every layer.
  const accessory = getOption('accessory', config.accessory)
  const accSvg = accessory.svg ?? ''
  const layers = accessory.back ? accSvg + body : body + accSvg

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ` +
    `width="${size}" height="${size}">` +
    `<defs>${FILTER_DEFS}</defs>` +
    `<g filter="url(#dm-rough)" stroke="#2e2018" stroke-width="3" ` +
    `stroke-linejoin="round" stroke-linecap="round">` +
    `<g transform="translate(100 120) scale(${scale}) translate(-100 -120)" ` +
    `style="color:${color}">` +
    layers +
    `</g></g></svg>`
  )
}
