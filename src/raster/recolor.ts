/** Load an image element from a URL. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('failed to load ' + src))
    img.src = src
  })
}

// Recolor tuning — keep in sync with scripts/render-check.cjs.
export const INK: [number, number, number] = [40, 35, 31] // fixed dark outline ink, re-asserted on every colour
const FLOOR = 0.5 // coat lightness floor: even "black" stays a dark charcoal so the outline still reads
const INK_LUM = 0.46 // luminance below this is treated as line-art and pulled toward INK

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export interface SpotOpts {
  hex: string
  seed?: number
}

/** Procedural spot mask over the body area (cy 0.42..0.85), off the face. */
function spotMask(w: number, h: number, seed: number): Uint8Array {
  let s = seed >>> 0
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const blobs: { cx: number; cy: number; rx: number; ry: number }[] = []
  for (let i = 0; i < 11; i++) {
    blobs.push({ cx: (0.2 + rnd() * 0.6) * w, cy: (0.42 + rnd() * 0.43) * h, rx: (0.035 + rnd() * 0.05) * w, ry: (0.035 + rnd() * 0.05) * w })
  }
  const m = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    for (const b of blobs) { const dx = (x - b.cx) / b.rx, dy = (y - b.cy) / b.ry; if (dx * dx + dy * dy <= 1) { m[y * w + x] = 1; break } }
  }
  return m
}

/**
 * Recolor a grayscale base (transparent background) to `hex`.
 * Per-pixel: tint the coat with a lightness FLOOR (so dark colours don't collapse) and
 * re-assert a consistent dark INK outline on the line-art, so every colour — including black —
 * keeps a readable outline. Optional `spots` paint a 2nd colour over the body.
 */
export function recolor(
  img: CanvasImageSource,
  width: number,
  height: number,
  hex: string,
  spots?: SpotOpts,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const w = Math.round(width), h = Math.round(height)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const id = ctx.getImageData(0, 0, w, h)
  const d = id.data
  const [tr, tg, tb] = hexToRgb(hex)
  const sp = spots ? spotMask(w, h, spots.seed ?? 7) : null
  const [sr, sg, sb] = spots ? hexToRgb(spots.hex) : [0, 0, 0]
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    if (d[i + 3] === 0) continue
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    const shade = FLOOR + (1 - FLOOR) * lum
    let cr, cg, cb
    if (sp && sp[p]) { cr = sr * shade; cg = sg * shade; cb = sb * shade }
    else { cr = tr * shade; cg = tg * shade; cb = tb * shade }
    let ink = (INK_LUM - lum) / INK_LUM
    ink = ink < 0 ? 0 : ink > 1 ? 1 : ink
    ink *= ink
    d[i] = cr + (INK[0] - cr) * ink
    d[i + 1] = cg + (INK[1] - cg) * ink
    d[i + 2] = cb + (INK[2] - cb) * ink
  }
  ctx.putImageData(id, 0, 0)
  return canvas
}
