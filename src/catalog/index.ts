import type { Catalog, CategoryKey, DogConfig, Option } from '../types'
import { PARTS } from './parts'

export const CATEGORY_KEYS: CategoryKey[] = [
  'bodyType', 'size', 'fur', 'color', 'ears', 'eyes', 'nose', 'mouth',
]

/** Categories that draw an SVG layer, in back-to-front order. */
export const LAYER_CATEGORY_KEYS: CategoryKey[] = [
  'bodyType', 'fur', 'ears', 'eyes', 'nose', 'mouth',
]

export const catalog: Catalog = [
  {
    key: 'bodyType', label: 'Body', zIndex: 10,
    options: [
      { id: 'body-classic', label: 'Classic', svg: PARTS.bodyClassic },
      { id: 'body-slim', label: 'Slim', svg: PARTS.bodySlim },
    ],
  },
  {
    key: 'size', label: 'Size',
    defaultId: 'size-normal',
    options: [
      { id: 'size-tiny', label: 'Tiny', scale: 0.62 },
      { id: 'size-small', label: 'Small', scale: 0.8 },
      { id: 'size-normal', label: 'Normal', scale: 1 },
      { id: 'size-big', label: 'Big', scale: 1.14 },
      { id: 'size-giant', label: 'Giant', scale: 1.28 },
    ],
  },
  {
    key: 'fur', label: 'Fur', zIndex: 20,
    options: [
      { id: 'fur-short', label: 'Short', svg: PARTS.furShort },
      { id: 'fur-fluffy', label: 'Fluffy', svg: PARTS.furFluffy },
    ],
  },
  {
    key: 'color', label: 'Colour',
    options: [
      { id: 'col-classic', label: 'Classic brown', color: '#c98a5e' },
      { id: 'col-choco', label: 'Chocolate', color: '#6b4a2f' },
      { id: 'col-golden', label: 'Golden', color: '#e0aa55' },
      { id: 'col-black', label: 'Black', color: '#3a3330' },
      { id: 'col-cream', label: 'Cream', color: '#f2d9b8' },
      { id: 'col-caramel', label: 'Caramel', color: '#9b6a3f' },
      { id: 'col-apricot', label: 'Apricot', color: '#d98a6a' },
      { id: 'col-fawn', label: 'Fawn', color: '#caa46f' },
    ],
  },
  {
    key: 'ears', label: 'Ears', zIndex: 30,
    options: [
      { id: 'ears-floppy', label: 'Floppy', svg: PARTS.earsFloppy },
      { id: 'ears-pointy', label: 'Pointy', svg: PARTS.earsPointy },
      { id: 'ears-round', label: 'Round', svg: PARTS.earsRound },
    ],
  },
  {
    key: 'eyes', label: 'Eyes', zIndex: 40,
    options: [
      { id: 'eyes-dots', label: 'Dots', svg: PARTS.eyesDots },
      { id: 'eyes-sparkle', label: 'Sparkle', svg: PARTS.eyesSparkle },
      { id: 'eyes-happy', label: 'Happy', svg: PARTS.eyesHappy },
    ],
  },
  {
    key: 'nose', label: 'Nose', zIndex: 50,
    options: [
      { id: 'nose-oval', label: 'Oval', svg: PARTS.noseOval },
      { id: 'nose-tri', label: 'Triangle', svg: PARTS.noseTri },
    ],
  },
  {
    key: 'mouth', label: 'Mouth', zIndex: 60,
    options: [
      { id: 'mouth-smile', label: 'Smile', svg: PARTS.mouthSmile },
      { id: 'mouth-tongue', label: 'Tongue', svg: PARTS.mouthTongue },
    ],
  },
]

const byKey = new Map(catalog.map((c) => [c.key, c]))

export function getCategory(key: CategoryKey) {
  return byKey.get(key)!
}

/** Returns the option with `id`, or the category's first option as a safe default. */
export function getOption(key: CategoryKey, id: string): Option {
  const cat = getCategory(key)
  return cat.options.find((o) => o.id === id) ?? cat.options[0]
}

const HEX_RE = /^hex:[0-9a-fA-F]{6}$/

export function colorHex(config: DogConfig): string {
  const id = config.color
  if (HEX_RE.test(id)) return '#' + id.slice(4)
  return getOption('color', id).color ?? '#c98a5e'
}

export function sizeScale(config: DogConfig): number {
  return getOption('size', config.size).scale ?? 1
}

export function isValidOptionId(key: CategoryKey, id: string): boolean {
  if (key === 'color' && HEX_RE.test(id)) return true
  return getCategory(key).options.some((o) => o.id === id)
}
