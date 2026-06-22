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

export type SpotPattern = 'blobs' | 'dots' | 'patches' | 'splash' | 'stripes' | 'cheetah' | 'hearts' | 'stars'

export interface SpotOpts {
  hex: string
  pattern?: SpotPattern
  seed?: number
}

/** Procedural spot mask over the body area (cy 0.42..0.85), off the face. */
function spotMask(w: number, h: number, pattern: SpotPattern, seed: number): Uint8Array {
  let s = (seed >>> 0) || 1
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const m = new Uint8Array(w * h)
  const stamp = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    const cos = Math.cos(rot), sin = Math.sin(rot)
    const r = Math.max(rx, ry) + 1
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r))
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy
      const u = (dx * cos + dy * sin) / rx, v = (-dx * sin + dy * cos) / ry
      if (u * u + v * v <= 1) m[y * w + x] = 1
    }
  }
  const inBody = (y: number) => y > 0.42 * h && y < 0.85 * h
  if (pattern === 'dots') {
    // many small dalmatian dots scattered across the body
    for (let i = 0; i < 28; i++) {
      const cx = (0.18 + rnd() * 0.64) * w, cy = (0.42 + rnd() * 0.43) * h
      const r = (0.018 + rnd() * 0.022) * w
      if (inBody(cy)) stamp(cx, cy, r, r * (0.85 + rnd() * 0.3))
    }
  } else if (pattern === 'patches') {
    // a few large irregular patches (border-collie look)
    for (let i = 0; i < 4; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.46 + rnd() * 0.34) * h
      const rx = (0.10 + rnd() * 0.08) * w, ry = (0.08 + rnd() * 0.08) * w
      stamp(cx, cy, rx, ry, rnd() * Math.PI)
      // 1–2 satellite blobs
      for (let j = 0; j < 2; j++) {
        const ang = rnd() * Math.PI * 2, d = (rx + ry) * 0.55
        const r2 = (0.025 + rnd() * 0.04) * w
        stamp(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, r2, r2 * (0.9 + rnd() * 0.3))
      }
    }
  } else if (pattern === 'splash') {
    // organic clusters of overlapping small blobs — looks like a splash
    for (let i = 0; i < 5; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.45 + rnd() * 0.38) * h
      for (let j = 0; j < 9; j++) {
        const ang = rnd() * Math.PI * 2, d = rnd() * 0.09 * w
        const r = (0.018 + rnd() * 0.034) * w
        stamp(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, r, r * (0.7 + rnd() * 0.6))
      }
    }
  } else if (pattern === 'stripes') {
    // horizontal tiger stripes across the body
    const yMin = 0.42 * h, yMax = 0.85 * h
    let cy = yMin + rnd() * 0.05 * h
    while (cy < yMax) {
      const thick = (0.018 + rnd() * 0.022) * h
      const halfW = (0.22 + rnd() * 0.14) * w
      const cx = w / 2 + (rnd() - 0.5) * 0.06 * w
      for (let y = Math.max(0, Math.floor(cy - thick)); y <= Math.min(h - 1, Math.ceil(cy + thick)); y++) {
        const t = (y - cy) / thick // -1..1 across the stripe
        const halfHere = halfW * Math.sqrt(Math.max(0, 1 - t * t)) // slight tapering
        const x0 = Math.max(0, Math.floor(w / 2 - halfHere + (cx - w / 2)))
        const x1 = Math.min(w - 1, Math.ceil(w / 2 + halfHere + (cx - w / 2)))
        for (let x = x0; x <= x1; x++) m[y * w + x] = 1
      }
      cy += thick * 2 + (0.025 + rnd() * 0.025) * h
    }
  } else if (pattern === 'cheetah') {
    // many small ring-shaped spots (open centres) — cheetah rosettes
    for (let i = 0; i < 22; i++) {
      const cx = (0.2 + rnd() * 0.6) * w, cy = (0.42 + rnd() * 0.43) * h
      const r = (0.025 + rnd() * 0.018) * w
      if (!inBody(cy)) continue
      const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(w - 1, Math.ceil(cx + r + 1))
      const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(h - 1, Math.ceil(cy + r + 1))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy)
        if (d <= r && d >= r * 0.55) m[y * w + x] = 1 // ring (annulus)
      }
    }
  } else if (pattern === 'hearts') {
    // implicit heart curve: (u² + v² - 1)³ ≤ u²·v³
    const stampHeart = (cx: number, cy: number, sz: number) => {
      const r = sz * 1.3
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r))
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = (x - cx) / sz, v = -(y - cy) / sz + 0.15
        const a = u * u + v * v - 1
        if (a * a * a - u * u * v * v * v <= 0) m[y * w + x] = 1
      }
    }
    for (let i = 0; i < 8; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.45 + rnd() * 0.38) * h
      const sz = (0.05 + rnd() * 0.025) * w
      stampHeart(cx, cy, sz)
    }
  } else if (pattern === 'stars') {
    // 5-point star via polar radius wave
    const stampStar = (cx: number, cy: number, r: number, phase: number) => {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r))
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy)
        if (d > r) continue
        const ang = Math.atan2(dy, dx) + phase
        const t = ((ang / Math.PI * 2.5) + 100) % 1 // 0..1 sawtooth
        const f = Math.abs(t - 0.5) * 2 // 0 at points, 1 at inner notches
        const rmax = r * (0.42 + 0.58 * (1 - f))
        if (d <= rmax) m[y * w + x] = 1
      }
    }
    for (let i = 0; i < 9; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.44 + rnd() * 0.4) * h
      const r = (0.05 + rnd() * 0.025) * w
      stampStar(cx, cy, r, rnd() * Math.PI * 2)
    }
  } else {
    // 'blobs' (default) — medium evenly-spread blobs
    for (let i = 0; i < 11; i++) {
      const cx = (0.2 + rnd() * 0.6) * w, cy = (0.42 + rnd() * 0.43) * h
      const r = (0.035 + rnd() * 0.05) * w
      stamp(cx, cy, r, r * (0.9 + rnd() * 0.2))
    }
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
  soft = false,
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
  const sp = spots ? spotMask(w, h, spots.pattern ?? 'blobs', spots.seed ?? 7) : null
  const [sr, sg, sb] = spots ? hexToRgb(spots.hex) : [0, 0, 0]
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    if (d[i + 3] === 0) continue
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    const shade = FLOOR + (1 - FLOOR) * lum
    let cr, cg, cb
    if (sp && sp[p]) { cr = sr * shade; cg = sg * shade; cb = sb * shade }
    else { cr = tr * shade; cg = tg * shade; cb = tb * shade }
    // Soft coat (silky): the airy pencil sketch is a near-white body with fine strands. A plain tint
    // multiplies the whole body to one flat coat colour (over-painted). Instead lift the LIGHT areas
    // toward white so the body reads as soft pastel fur, while mid-tone strands keep the colour and
    // dark line-art still inks below. The lift only grows in the upper luminance range.
    if (soft) {
      let lift = (lum - 0.5) / 0.5
      if (lift < 0) lift = 0
      lift = lift * lift * 0.66
      cr += (255 - cr) * lift; cg += (255 - cg) * lift; cb += (255 - cb) * lift
    }
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
