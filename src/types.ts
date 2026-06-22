export type CategoryKey =
  | 'bodyType' | 'size' | 'fur' | 'color'
  | 'ears' | 'eyes' | 'nose' | 'mouth' | 'accessory'

export type DogConfig = Record<CategoryKey, string>

export interface Option {
  id: string
  label: string
  /** SVG fragment authored in the shared -30 -10 260 260 grid. Omitted for size/color. */
  svg?: string
  /** Hex color for `color` category options. */
  color?: string
  /** Scale factor for `size` category options. */
  scale?: number
  /** Accessory layer: when true the part draws behind the dog (e.g. wings). */
  back?: boolean
}

export interface Category {
  key: CategoryKey
  label: string
  /** Layer order for parts that draw svg; undefined for size/color (no layer). */
  zIndex?: number
  options: Option[]
  /** Option id to use as the default; falls back to the first option. */
  defaultId?: string
}

export type Catalog = Category[]
