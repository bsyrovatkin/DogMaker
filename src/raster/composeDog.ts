import { recolor, INK } from './recolor'

/** Anchor expressed as fractions of the base canvas: where a part's center goes and how wide it is. */
export interface Anchor {
  cx: number
  cy: number
  w: number
}

interface Box { x: number; y: number; w: number; h: number }

const ALPHA_T = 110
const PART_RES = 384 // parts are smaller than the dog — work at reduced res for speed
const PINK: [number, number, number] = [233, 120, 140] // tongue / open mouth interior
const WHITE: [number, number, number] = [255, 255, 255]

const smoothstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

const partCache = new Map<string, { canvas: HTMLCanvasElement; box: Box }>()

/**
 * Drop a part's background (faint halo / opaque white) by flood-filling from the borders, keep
 * enclosed fills. `inkify` remaps the part's tones to the shared dark INK + white so the nose/eyes
 * match the body outline. `pink` paints the enclosed near-white interior (tongue / open mouth).
 */
function cleanPart(img: HTMLImageElement, opts: { pink?: [number, number, number]; inkify?: boolean } = {}): { canvas: HTMLCanvasElement; box: Box } {
  const { pink, inkify } = opts
  const key = img.src + (pink ? '|p' : '') + (inkify ? '|i' : '')
  const cached = partCache.get(key)
  if (cached) return cached

  const w = PART_RES
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * PART_RES))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const id = ctx.getImageData(0, 0, w, h)
  const d = id.data

  const isBg = (p: number) => {
    const i = p * 4
    if (d[i + 3] < ALPHA_T) return true
    return d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235
  }

  const stack: number[] = []
  for (let x = 0; x < w; x++) { stack.push(x, x + (h - 1) * w) }
  for (let y = 0; y < h; y++) { stack.push(y * w, w - 1 + y * w) }
  const visited = new Uint8Array(w * h)
  while (stack.length) {
    const p = stack.pop()!
    if (visited[p]) continue
    visited[p] = 1
    if (!isBg(p)) continue
    d[p * 4 + 3] = 0
    const x = p % w
    const y = (p / w) | 0
    if (x + 1 < w) stack.push(p + 1)
    if (x > 0) stack.push(p - 1)
    if (y + 1 < h) stack.push(p + w)
    if (y > 0) stack.push(p - w)
  }

  // Inkify: nose/eyes use the shared dark INK; enclosed fills (eye highlight) stay white; the
  // light anti-alias ring fades to TRANSPARENT (not white) so there's no pale halo around parts.
  if (inkify) {
    const nearWhite = (p: number) => { const i = p * 4; return d[i + 3] >= ALPHA_T && d[i] > 222 && d[i + 1] > 222 && d[i + 2] > 222 }
    const trans = (p: number) => d[p * 4 + 3] < ALPHA_T
    // flood the exterior near-white ring (touches the cut-out background) so enclosed fills survive
    const ext = new Uint8Array(w * h)
    const es: number[] = []
    for (let p = 0; p < w * h; p++) {
      if (!nearWhite(p)) continue
      const x = p % w, y = (p / w) | 0
      if ((x + 1 >= w || trans(p + 1)) || (x - 1 < 0 || trans(p - 1)) || (y + 1 >= h || trans(p + w)) || (y - 1 < 0 || trans(p - w))) { ext[p] = 1; es.push(p) }
    }
    while (es.length) {
      const p = es.pop()!, x = p % w, y = (p / w) | 0
      if (x + 1 < w && nearWhite(p + 1) && !ext[p + 1]) { ext[p + 1] = 1; es.push(p + 1) }
      if (x > 0 && nearWhite(p - 1) && !ext[p - 1]) { ext[p - 1] = 1; es.push(p - 1) }
      if (y + 1 < h && nearWhite(p + w) && !ext[p + w]) { ext[p + w] = 1; es.push(p + w) }
      if (y > 0 && nearWhite(p - w) && !ext[p - w]) { ext[p - w] = 1; es.push(p - w) }
    }
    for (let p = 0; p < w * h; p++) {
      const i = p * 4
      if (d[i + 3] === 0) continue
      if (nearWhite(p) && !ext[p]) { d[i] = WHITE[0]; d[i + 1] = WHITE[1]; d[i + 2] = WHITE[2]; continue } // enclosed fill stays white
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
      const coverage = 1 - smoothstep(0.4, 0.85, lum) // dark ink fully opaque, light edge fades out
      d[i] = INK[0]; d[i + 1] = INK[1]; d[i + 2] = INK[2]
      d[i + 3] = Math.round(d[i + 3] * coverage)
    }
  }

  // paint the enclosed interior (what's left near-white after the border flood) pink
  if (pink) {
    for (let p = 0; p < w * h; p++) {
      const i = p * 4
      if (d[i + 3] >= ALPHA_T && d[i] > 222 && d[i + 1] > 222 && d[i + 2] > 222) {
        d[i] = pink[0]; d[i + 1] = pink[1]; d[i + 2] = pink[2]
      }
    }
  }

  let minX = w, minY = h, maxX = 0, maxY = 0, found = false
  for (let p = 0; p < w * h; p++) {
    if (d[p * 4 + 3] >= ALPHA_T) {
      found = true
      const x = p % w
      const y = (p / w) | 0
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  ctx.putImageData(id, 0, 0)
  const box: Box = found ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w, h }
  const res = { canvas: c, box }
  partCache.set(key, res)
  return res
}

export interface PortraitSpec {
  base: HTMLImageElement
  color: string
  size?: number
  /** 2nd colour painted as spots over the body. */
  spotColor?: string
  spotSeed?: number
  /** Spot pattern shape (see SpotPattern). Defaults to 'blobs'. */
  spotPattern?: 'blobs' | 'dots' | 'patches' | 'splash' | 'stripes' | 'cheetah' | 'hearts' | 'stars'
  eyes?: HTMLImageElement
  eyeAnchor?: Anchor
  muzzle?: HTMLImageElement
  muzzleAnchor?: Anchor
  /** Paint the muzzle's enclosed interior (tongue / open "O") pink. */
  muzzlePink?: boolean
  /** Muzzle is already coloured (pink/tan) — draw it as-is, skip the grayscale inkify. */
  muzzleColored?: boolean
  ground?: HTMLImageElement
  groundAnchor?: Anchor
  accessory?: HTMLImageElement
  accessoryAnchor?: Anchor
  accessoryBack?: boolean
  /** Fraction (0..1) of the accessory's height to cut off the TOP — hides the wrap-around back of collars/scarves. */
  accessoryCropTop?: number
  /** Multiple accessories worn at once, layered: `back` ones behind the dog, the rest in front, in order. */
  accessories?: { img: HTMLImageElement; anchor: Anchor; back?: boolean; cropTop?: number }[]
  /** Transparent headroom added ABOVE the dog (fraction of width) so tall hats fit. Anchors stay relative to the dog. */
  headroom?: number
}

interface PlaceOpts { cropTop?: number; pink?: [number, number, number]; inkify?: boolean }

/** Compose a finished dog: ground + (back accessory) + recolored base + eyes + muzzle + (front accessory). */
export function composeDog(spec: PortraitSpec): HTMLCanvasElement {
  const bw = spec.base.naturalWidth
  const bh = spec.base.naturalHeight
  const W = spec.size ?? 512
  const baseH = Math.round(W * (bh / bw))
  const topPad = Math.round((spec.headroom ?? 0) * W)
  const H = baseH + topPad
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // anchors are fractions of the DOG region; topPad just shifts everything down, leaving headroom on top
  const place = (img: HTMLImageElement, a: Anchor, opts: PlaceOpts = {}) => {
    const { canvas: cl, box } = cleanPart(img, { pink: opts.pink, inkify: opts.inkify })
    const cropTop = opts.cropTop ?? 0
    const sy = box.y + box.h * cropTop
    const sh = box.h * (1 - cropTop)
    const scale = (a.w * W) / box.w
    const dw = box.w * scale
    const dh = sh * scale
    const dx = a.cx * W - dw / 2
    const dy = topPad + a.cy * baseH - dh / 2
    ctx.drawImage(cl, box.x, sy, box.w, sh, dx, dy, dw, dh)
  }

  if (spec.ground && spec.groundAnchor) place(spec.ground, spec.groundAnchor)
  if (spec.accessory && spec.accessoryBack && spec.accessoryAnchor) place(spec.accessory, spec.accessoryAnchor, { cropTop: spec.accessoryCropTop })
  for (const a of spec.accessories ?? []) if (a.back) place(a.img, a.anchor, { cropTop: a.cropTop })

  const spots = spec.spotColor ? { hex: spec.spotColor, seed: spec.spotSeed, pattern: spec.spotPattern } : undefined
  ctx.drawImage(recolor(spec.base, W, baseH, spec.color, spots), 0, topPad)

  if (spec.eyes && spec.eyeAnchor) place(spec.eyes, spec.eyeAnchor, { inkify: true })
  if (spec.muzzle && spec.muzzleAnchor) place(spec.muzzle, spec.muzzleAnchor, { inkify: !spec.muzzleColored, pink: spec.muzzleColored ? undefined : (spec.muzzlePink ? PINK : undefined) })
  if (spec.accessory && !spec.accessoryBack && spec.accessoryAnchor) place(spec.accessory, spec.accessoryAnchor, { cropTop: spec.accessoryCropTop })
  for (const a of spec.accessories ?? []) if (!a.back) place(a.img, a.anchor, { cropTop: a.cropTop })

  return canvas
}
