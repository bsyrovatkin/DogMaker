// QA renderer: composes a finished dog from the real assets with pngjs and writes PNGs.
// This mirrors the in-app compositor so we can verify the recolor/outline/pink-mouth/spots
// fixes by Read-ing the output (the live preview screenshot channel is dead).
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const DIR = 'D:/Projects/DogMaker/public'
const OUT = 'D:/Projects/DogMaker/qa-out'
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT)

const load = (p) => PNG.sync.read(fs.readFileSync(path.join(DIR, p)))
const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

// ---- recolor tuning ----
const INK = [40, 35, 31]   // fixed dark outline ink, re-asserted on every colour
const FLOOR = 0.5          // coat lightness floor: even "black" stays a dark charcoal
const INK_LUM = 0.46       // luminance below this is treated as line-art (gets inked)
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
// Inkify: nose/eyes → shared INK; enclosed fills (eye highlight) stay white; light anti-alias ring
// fades to transparent (not white) so there's no pale halo around parts.
function inkify(part) {
  const { data: d, w, h } = part
  const A = 60
  const nearWhite = (p) => { const i = p * 4; return d[i + 3] >= A && d[i] > 222 && d[i + 1] > 222 && d[i + 2] > 222 }
  const trans = (p) => d[p * 4 + 3] < A
  const ext = new Uint8Array(w * h), es = []
  for (let p = 0; p < w * h; p++) {
    if (!nearWhite(p)) continue
    const x = p % w, y = (p / w) | 0
    if ((x + 1 >= w || trans(p + 1)) || (x - 1 < 0 || trans(p - 1)) || (y + 1 >= h || trans(p + w)) || (y - 1 < 0 || trans(p - w))) { ext[p] = 1; es.push(p) }
  }
  while (es.length) {
    const p = es.pop(), x = p % w, y = (p / w) | 0
    if (x + 1 < w && nearWhite(p + 1) && !ext[p + 1]) { ext[p + 1] = 1; es.push(p + 1) }
    if (x > 0 && nearWhite(p - 1) && !ext[p - 1]) { ext[p - 1] = 1; es.push(p - 1) }
    if (y + 1 < h && nearWhite(p + w) && !ext[p + w]) { ext[p + w] = 1; es.push(p + w) }
    if (y > 0 && nearWhite(p - w) && !ext[p - w]) { ext[p - w] = 1; es.push(p - w) }
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    if (d[i + 3] === 0) continue
    if (nearWhite(p) && !ext[p]) { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; continue }
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    const coverage = 1 - smoothstep(0.4, 0.85, lum)
    d[i] = INK[0]; d[i + 1] = INK[1]; d[i + 2] = INK[2]
    d[i + 3] = Math.round(d[i + 3] * coverage)
  }
  return part
}

// ---- bilinear sample on an RGBA buffer ----
function sample(data, w, h, x, y) {
  x = clamp(x, 0, w - 1.001); y = clamp(y, 0, h - 1.001)
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = x0 + 1, y1 = y0 + 1, fx = x - x0, fy = y - y0
  const at = (xx, yy) => (yy * w + xx) * 4
  const o = [0, 0, 0, 0]
  for (let c = 0; c < 4; c++) {
    o[c] = data[at(x0, y0) + c] * (1 - fx) * (1 - fy) + data[at(x1, y0) + c] * fx * (1 - fy) +
      data[at(x0, y1) + c] * (1 - fx) * fy + data[at(x1, y1) + c] * fx * fy
  }
  return o
}

function resize(png, RW) {
  const { width: w, height: h } = png
  const RH = Math.round(h * RW / w)
  const out = Buffer.alloc(RW * RH * 4)
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const s = sample(png.data, w, h, (x + 0.5) * w / RW - 0.5, (y + 0.5) * h / RH - 0.5)
    const i = (y * RW + x) * 4
    out[i] = s[0]; out[i + 1] = s[1]; out[i + 2] = s[2]; out[i + 3] = s[3]
  }
  return { width: RW, height: RH, data: out }
}

// procedural spot mask — 4 named patterns (mirrors src/raster/recolor.ts)
function spotMask(w, h, pattern, seed) {
  let s = (seed >>> 0) || 1
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const m = new Uint8Array(w * h)
  const stamp = (cx, cy, rx, ry, rot = 0) => {
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
  const inBody = (y) => y > 0.42 * h && y < 0.85 * h
  if (pattern === 'dots') {
    for (let i = 0; i < 28; i++) { const cx = (0.18 + rnd() * 0.64) * w, cy = (0.42 + rnd() * 0.43) * h, r = (0.018 + rnd() * 0.022) * w; if (inBody(cy)) stamp(cx, cy, r, r * (0.85 + rnd() * 0.3)) }
  } else if (pattern === 'patches') {
    for (let i = 0; i < 4; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.46 + rnd() * 0.34) * h, rx = (0.10 + rnd() * 0.08) * w, ry = (0.08 + rnd() * 0.08) * w
      stamp(cx, cy, rx, ry, rnd() * Math.PI)
      for (let j = 0; j < 2; j++) { const ang = rnd() * Math.PI * 2, d = (rx + ry) * 0.55, r2 = (0.025 + rnd() * 0.04) * w; stamp(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, r2, r2 * (0.9 + rnd() * 0.3)) }
    }
  } else if (pattern === 'splash') {
    for (let i = 0; i < 5; i++) {
      const cx = (0.22 + rnd() * 0.56) * w, cy = (0.45 + rnd() * 0.38) * h
      for (let j = 0; j < 9; j++) { const ang = rnd() * Math.PI * 2, d = rnd() * 0.09 * w, r = (0.018 + rnd() * 0.034) * w; stamp(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, r, r * (0.7 + rnd() * 0.6)) }
    }
  } else if (pattern === 'stripes') {
    const yMin = 0.42 * h, yMax = 0.85 * h
    let cy = yMin + rnd() * 0.05 * h
    while (cy < yMax) {
      const thick = (0.018 + rnd() * 0.022) * h
      const halfW = (0.22 + rnd() * 0.14) * w
      const cx = w / 2 + (rnd() - 0.5) * 0.06 * w
      for (let y = Math.max(0, Math.floor(cy - thick)); y <= Math.min(h - 1, Math.ceil(cy + thick)); y++) {
        const t = (y - cy) / thick
        const halfHere = halfW * Math.sqrt(Math.max(0, 1 - t * t))
        const x0 = Math.max(0, Math.floor(w / 2 - halfHere + (cx - w / 2)))
        const x1 = Math.min(w - 1, Math.ceil(w / 2 + halfHere + (cx - w / 2)))
        for (let x = x0; x <= x1; x++) m[y * w + x] = 1
      }
      cy += thick * 2 + (0.025 + rnd() * 0.025) * h
    }
  } else if (pattern === 'cheetah') {
    for (let i = 0; i < 22; i++) {
      const cx = (0.2 + rnd() * 0.6) * w, cy = (0.42 + rnd() * 0.43) * h, r = (0.025 + rnd() * 0.018) * w
      if (!inBody(cy)) continue
      const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(w - 1, Math.ceil(cx + r + 1))
      const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(h - 1, Math.ceil(cy + r + 1))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy)
        if (d <= r && d >= r * 0.55) m[y * w + x] = 1
      }
    }
  } else if (pattern === 'hearts') {
    const stampHeart = (cx, cy, sz) => {
      const r = sz * 1.3
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r))
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = (x - cx) / sz, v = -(y - cy) / sz + 0.15
        const a = u * u + v * v - 1
        if (a * a * a - u * u * v * v * v <= 0) m[y * w + x] = 1
      }
    }
    for (let i = 0; i < 8; i++) { const cx = (0.22 + rnd() * 0.56) * w, cy = (0.45 + rnd() * 0.38) * h, sz = (0.05 + rnd() * 0.025) * w; stampHeart(cx, cy, sz) }
  } else if (pattern === 'stars') {
    const stampStar = (cx, cy, r, phase) => {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r))
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy); if (d > r) continue
        const ang = Math.atan2(dy, dx) + phase
        const t = ((ang / Math.PI * 2.5) + 100) % 1
        const f = Math.abs(t - 0.5) * 2
        const rmax = r * (0.42 + 0.58 * (1 - f))
        if (d <= rmax) m[y * w + x] = 1
      }
    }
    for (let i = 0; i < 9; i++) { const cx = (0.22 + rnd() * 0.56) * w, cy = (0.44 + rnd() * 0.4) * h, r = (0.05 + rnd() * 0.025) * w; stampStar(cx, cy, r, rnd() * Math.PI * 2) }
  } else {
    for (let i = 0; i < 11; i++) { const cx = (0.2 + rnd() * 0.6) * w, cy = (0.42 + rnd() * 0.43) * h, r = (0.035 + rnd() * 0.05) * w; stamp(cx, cy, r, r * (0.9 + rnd() * 0.2)) }
  }
  return m
}

// recolor a (resized) grayscale base: coat tint with floor + spots + re-asserted ink outline
function recolorBase(base, coatHex, spotHex, seed, pattern) {
  const { width: w, height: h, data: src } = base
  const out = Buffer.alloc(w * h * 4)
  const [tr, tg, tb] = hex(coatHex)
  const spots = spotHex ? spotMask(w, h, pattern || 'blobs', seed || 7) : null
  const [sr, sg, sb] = spotHex ? hex(spotHex) : [0, 0, 0]
  for (let p = 0; p < w * h; p++) {
    const i = p * 4, a = src[i + 3]
    if (a === 0) { out[i + 3] = 0; continue }
    const r = src[i], g = src[i + 1], b = src[i + 2]
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const shade = FLOOR + (1 - FLOOR) * lum
    let cr, cg, cb
    if (spots && spots[p]) { cr = sr * shade; cg = sg * shade; cb = sb * shade }
    else { cr = tr * shade; cg = tg * shade; cb = tb * shade }
    let ink = clamp((INK_LUM - lum) / INK_LUM, 0, 1); ink = ink * ink
    out[i] = cr + (INK[0] - cr) * ink
    out[i + 1] = cg + (INK[1] - cg) * ink
    out[i + 2] = cb + (INK[2] - cb) * ink
    out[i + 3] = a
  }
  return { width: w, height: h, data: out }
}

// remove the base's opaque near-white background (flood-fill from borders → alpha 0, RGB kept for soft edges)
function cleanBaseBg(png) {
  const { width: w, height: h } = png
  const d = Uint8Array.from(png.data)
  const isBg = (p) => { const i = p * 4; return d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 232 }
  const seen = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w)
  for (let y = 0; y < h; y++) st.push(y * w, w - 1 + y * w)
  while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!isBg(p)) continue; d[p * 4 + 3] = 0; const x = p % w, y = (p / w) | 0; if (x + 1 < w) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < h) st.push(p + w); if (y > 0) st.push(p - w) }
  return { width: w, height: h, data: d }
}

// flood-fill background removal from borders → returns cleaned data + content box
function cleanPart(png) {
  const { width: w, height: h } = png
  const d = Uint8Array.from(png.data)
  const isBg = (p) => { const i = p * 4; if (d[i + 3] < 60) return true; return d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235 }
  const seen = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w)
  for (let y = 0; y < h; y++) st.push(y * w, w - 1 + y * w)
  while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!isBg(p)) continue; d[p * 4 + 3] = 0; const x = p % w, y = (p / w) | 0; if (x + 1 < w) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < h) st.push(p + w); if (y > 0) st.push(p - w) }
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false
  for (let p = 0; p < w * h; p++) if (d[p * 4 + 3] >= 60) { found = true; const x = p % w, y = (p / w) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
  return { data: d, w, h, box: found ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w, h } }
}

// enclosed near-white pixels (interior holes) — the tongue / open mouth to paint pink
function interiorMask(png) {
  const { width: w, height: h, data: d } = png
  const nw = (p) => { const i = p * 4; return d[i + 3] >= 60 && d[i] > 222 && d[i + 1] > 222 && d[i + 2] > 222 }
  const seen = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w)
  for (let y = 0; y < h; y++) st.push(y * w, w - 1 + y * w)
  while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!nw(p)) continue; const x = p % w, y = (p / w) | 0; if (x + 1 < w) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < h) st.push(p + w); if (y > 0) st.push(p - w) }
  const m = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) if (nw(p) && !seen[p]) m[p] = 1
  return m
}

function blend(c, ci, r, g, b, a) {
  const af = a / 255, da = c[ci + 3] / 255, oa = af + da * (1 - af)
  if (oa <= 0) { c[ci] = c[ci + 1] = c[ci + 2] = c[ci + 3] = 0; return }
  c[ci] = (r * af + c[ci] * da * (1 - af)) / oa
  c[ci + 1] = (g * af + c[ci + 1] * da * (1 - af)) / oa
  c[ci + 2] = (b * af + c[ci + 2] * da * (1 - af)) / oa
  c[ci + 3] = oa * 255
}

// draw a cleaned part onto the canvas at an anchor (fractions of W,H), optional top-crop + pink interior
function over(canvas, W, H, part, anchor, opts = {}) {
  const { data, w: pw, h: ph, box } = part
  const cropTop = opts.cropTop || 0
  const sy = box.y + box.h * cropTop, sh = box.h * (1 - cropTop)
  const scale = (anchor.w * W) / box.w
  const ow = box.w * scale, oh = sh * scale
  const dx = anchor.cx * W - ow / 2, dy = TOPPAD + anchor.cy * BASEH - oh / 2
  const pink = opts.pink, mask = opts.mask
  for (let yy = 0; yy < Math.ceil(oh); yy++) {
    const ty = Math.round(dy + yy); if (ty < 0 || ty >= H) continue
    const fy = sy + (yy / oh) * sh
    for (let xx = 0; xx < Math.ceil(ow); xx++) {
      const tx = Math.round(dx + xx); if (tx < 0 || tx >= W) continue
      const fx = box.x + (xx / ow) * box.w
      const s = sample(data, pw, ph, fx, fy); let [r, g, b, a] = s; if (a < 3) continue
      if (pink && mask && mask[Math.round(fy) * pw + Math.round(fx)]) { r = pink[0]; g = pink[1]; b = pink[2] }
      blend(canvas, (ty * W + tx) * 4, r, g, b, a)
    }
  }
}

// ---- assets ----
const RW = 460
// bases are already baked transparent — load as-is (re-running cleanBaseBg would eat the light body)
const baseImg = (n) => resize(load(`bases/${n}.png`), RW)
const partImg = (n) => { const p = load(`parts/${n}.png`); return cleanPart(p) }
const inkPartImg = (n) => inkify(cleanPart(load(`parts/${n}.png`)))
const PINK = [233, 120, 140]
const EYE = { cx: 0.5, cy: 0.272, w: 0.208 }
const MUZ = { cx: 0.5, cy: 0.384, w: 0.092 }
const GROUND = { cx: 0.5, cy: 0.86, w: 0.98 }
const TOPPAD = Math.round(0.2 * RW)  // headroom above the dog (mirrors composeDog HEADROOM)
const BASEH = RW                      // bases are square after resize

function canvasFor(base) { const W = base.width, H = base.height + TOPPAD; return { buf: Buffer.alloc(W * H * 4), W, H } }
// copy a recolored base into a (taller) canvas at the headroom offset
function placeBase(c, base) { const W = base.width; for (let y = 0; y < base.height; y++) base.data.copy(c.buf, (y + TOPPAD) * W * 4, y * W * 4, (y + 1) * W * 4) }
function writePng(name, c) { const png = new PNG({ width: c.W, height: c.H }); c.buf.copy(png.data); fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png)); console.log('wrote', name, c.W + 'x' + c.H) }

// muzzle with pink interior
function muzzlePink(name) { const raw = load(`parts/${name}.png`); const mask = interiorMask(raw); const cleaned = inkify(cleanPart(raw)); return { part: cleaned, mask } }

// === test 1: black coat — outline must stay visible; pink tongue ===
{
  const base = recolorBase(baseImg('curly-floppy'), '#2c2824', null)
  const c = canvasFor(base); placeBase(c, base)
  over(c.buf, c.W, c.H, inkPartImg('eyes-dots'), EYE)
  const mp = muzzlePink('muzzle-tongue')
  over(c.buf, c.W, c.H, mp.part, MUZ, { pink: PINK, mask: mp.mask })
  writePng('1-black.png', c)
}

// === test 2: caramel + open-O pink mouth + collar (back cropped) + grass ===
{
  const base = recolorBase(baseImg('smooth-pointy'), '#a9713f', null)
  const c = canvasFor(base)
  over(c.buf, c.W, c.H, partImg('bg-grass'), GROUND)
  base.data.copy(new Uint8Array(0)) // noop guard
  // base over ground:
  const tmp = canvasFor(base); placeBase(tmp, base)
  // composite base buffer over ground buffer
  for (let p = 0; p < c.W * c.H; p++) { const i = p * 4; blend(c.buf, i, tmp.buf[i], tmp.buf[i + 1], tmp.buf[i + 2], tmp.buf[i + 3]) }
  over(c.buf, c.W, c.H, inkPartImg('eyes-big'), EYE)
  const mp = muzzlePink('muzzle-o')
  over(c.buf, c.W, c.H, mp.part, MUZ, { pink: PINK, mask: mp.mask })
  over(c.buf, c.W, c.H, partImg('acc-collar'), { cx: 0.5, cy: 0.52, w: 0.46 }, { cropTop: 0.42 })
  writePng('2-caramel-collar.png', c)
}

// === test 3: spotted dog ===
{
  const base = recolorBase(baseImg('fluffy-round'), '#ead8bd', '#a9713f', 11)
  const c = canvasFor(base); placeBase(c, base)
  over(c.buf, c.W, c.H, inkPartImg('eyes-happy'), EYE)
  over(c.buf, c.W, c.H, inkPartImg('muzzle-smile'), MUZ)
  writePng('3-spotted.png', c)
}

// === test 4: colour sanity row across the spectrum ===
{
  const colors = ['#2c2824', '#6b4a2f', '#a9713f', '#e0aa55', '#b15a36', '#9a9a9a', '#e6a0b0', '#f2ece2']
  const base0 = baseImg('curly-floppy')
  const W = base0.width, H = base0.height
  const sheet = { buf: Buffer.alloc(colors.length * W * H * 4), W: colors.length * W, H }
  colors.forEach((col, k) => {
    const rb = recolorBase(base0, col, null)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4, di = (y * sheet.W + k * W + x) * 4
      sheet.buf[di] = rb.data[si]; sheet.buf[di + 1] = rb.data[si + 1]; sheet.buf[di + 2] = rb.data[si + 2]; sheet.buf[di + 3] = rb.data[si + 3]
    }
  })
  writePng('4-colors.png', sheet)
}

// === edge check: large shaggy-pointy brown (matches the owner's screenshot) ===
{
  const base = recolorBase(baseImg('shaggy-pointy'), '#7a4f2e', null)
  const c = canvasFor(base); placeBase(c, base)
  over(c.buf, c.W, c.H, inkPartImg('eyes-big'), EYE)
  const mp = muzzlePink('muzzle-tongue')
  over(c.buf, c.W, c.H, mp.part, MUZ, { pink: PINK, mask: mp.mask })
  writePng('5-edge.png', c)
}

// === showcase: four finished dogs tiled into one sheet (product output) ===
const accJson = require('../src/raster/accessoryAnchors.json')
const ACC_DEF = {
  beanie: { a: { cx: 0.5, cy: 0.08, w: 0.37 } },
  partyhat: { a: { cx: 0.5, cy: 0.06, w: 0.26 } },
  crown: { a: { cx: 0.5, cy: 0.1, w: 0.4 } },
  bow: { a: { cx: 0.31, cy: 0.22, w: 0.22 } },
  glasses: { a: { cx: 0.5, cy: 0.28, w: 0.4 } },
  bandana: { a: { cx: 0.5, cy: 0.5, w: 0.5 }, crop: 0.22 },
  collar: { a: { cx: 0.5, cy: 0.52, w: 0.46 }, crop: 0.42 },
  scarf: { a: { cx: 0.5, cy: 0.52, w: 0.52 }, crop: 0.34 },
  tie: { a: { cx: 0.5, cy: 0.52, w: 0.15 } },
  wings: { a: { cx: 0.5, cy: 0.5, w: 0.98 }, back: true },
  spacewhite: { a: { cx: 0.5, cy: 0.27, w: 0.64 } },
  spaceblue: { a: { cx: 0.5, cy: 0.27, w: 0.64 } },
  hardhat: { a: { cx: 0.5, cy: 0.15, w: 0.5 } },
  melon: { a: { cx: 0.5, cy: 0.16, w: 0.54 } },
}
const ACC = {}
for (const k of Object.keys(ACC_DEF)) {
  const def = ACC_DEF[k], ov = accJson[k] || {}
  ACC[k] = { a: ov.anchor || def.a, back: def.back, crop: ov.cropTop != null ? ov.cropTop : def.crop }
}
function makeDog(o) {
  const base = recolorBase(baseImg(o.base), o.color, o.spot || null, o.seed || 7)
  const c = canvasFor(base)
  if (o.ground) over(c.buf, c.W, c.H, partImg('bg-' + o.ground), GROUND)
  if (o.acc && ACC[o.acc].back) over(c.buf, c.W, c.H, partImg('acc-' + o.acc), ACC[o.acc].a, { cropTop: ACC[o.acc].crop })
  const tmp = canvasFor(base); placeBase(tmp, base)
  for (let p = 0; p < c.W * c.H; p++) { const i = p * 4; blend(c.buf, i, tmp.buf[i], tmp.buf[i + 1], tmp.buf[i + 2], tmp.buf[i + 3]) }
  if (o.eyes) over(c.buf, c.W, c.H, inkPartImg('eyes-' + o.eyes), EYE)
  if (o.muzzle) {
    if (o.muzzle === 'tongue' || o.muzzle === 'o') { const mp = muzzlePink('muzzle-' + o.muzzle); over(c.buf, c.W, c.H, mp.part, MUZ, { pink: PINK, mask: mp.mask }) }
    else over(c.buf, c.W, c.H, inkPartImg('muzzle-' + o.muzzle), MUZ)
  }
  if (o.acc && !ACC[o.acc].back) over(c.buf, c.W, c.H, partImg('acc-' + o.acc), ACC[o.acc].a, { cropTop: ACC[o.acc].crop })
  return c
}
{
  const dogs = [
    { base: 'curly-floppy', color: '#e0aa55', eyes: 'sparkle', muzzle: 'smile', acc: 'beanie', ground: 'grass' },
    { base: 'fluffy-round', color: '#ead8bd', spot: '#a9713f', eyes: 'happy', muzzle: 'tongue', acc: 'crown', ground: 'flowers' },
    { base: 'smooth-pointy', color: '#2f2a26', eyes: 'wide', muzzle: 'o', acc: 'glasses', ground: 'wood' },
    { base: 'shaggy-floppy', color: '#9aa0a8', eyes: 'sleepy', muzzle: 'calm', acc: 'wings', ground: 'cloud' },
  ]
  const tiles = dogs.map(makeDog)
  const W = tiles[0].W, H = tiles[0].H, gap = 16
  const sheet = { buf: Buffer.alloc((W * 2 + gap) * (H * 2 + gap) * 4), W: W * 2 + gap, H: H * 2 + gap }
  tiles.forEach((t, k) => {
    const ox = (k % 2) * (W + gap), oy = ((k / 2) | 0) * (H + gap)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4, di = ((oy + y) * sheet.W + (ox + x)) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('showcase.png', sheet)
}

// === reproduce the app frame (headroom + height-fit + bottom-align) ===
{
  function frameOf(inner) {
    const P = inner.W
    const f = { buf: Buffer.alloc(P * P * 4), W: P, H: P }
    for (let i = 0; i < P * P; i++) { f.buf[i * 4] = 250; f.buf[i * 4 + 1] = 245; f.buf[i * 4 + 2] = 236; f.buf[i * 4 + 3] = 255 }
    const scale = (P / inner.H) * 0.94 // size 1
    const dw = Math.round(inner.W * scale), dh = Math.round(inner.H * scale)
    const ox = Math.round((P - dw) / 2), oy = P - dh
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const sx = Math.min(inner.W - 1, Math.round(x / scale)), sy = Math.min(inner.H - 1, Math.round(y / scale))
      const si = (sy * inner.W + sx) * 4, a = inner.buf[si + 3] / 255; if (a === 0) continue
      const ty = oy + y, tx = ox + x; if (ty < 0 || ty >= P || tx < 0 || tx >= P) continue
      const di = (ty * P + tx) * 4
      f.buf[di] = inner.buf[si] * a + f.buf[di] * (1 - a); f.buf[di + 1] = inner.buf[si + 1] * a + f.buf[di + 1] * (1 - a); f.buf[di + 2] = inner.buf[si + 2] * a + f.buf[di + 2] * (1 - a)
    }
    return f
  }
  const a = frameOf(makeDog({ base: 'curly-floppy', color: '#c98a5e', eyes: 'dots', muzzle: 'smile', acc: 'partyhat', ground: 'grass' }))
  const b = frameOf(makeDog({ base: 'curly-floppy', color: '#4b443c', eyes: 'dots', muzzle: 'smile', ground: 'grass' }))
  const P = a.W, gap = 16, sheet = { buf: Buffer.alloc((P * 2 + gap) * P * 4), W: P * 2 + gap, H: P }
  for (let i = 0; i < sheet.W * sheet.H; i++) { sheet.buf[i * 4] = 255; sheet.buf[i * 4 + 1] = 255; sheet.buf[i * 4 + 2] = 255; sheet.buf[i * 4 + 3] = 255 }
  ;[a, b].forEach((fr, k) => { const ox = k * (P + gap); for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) { const si = (y * P + x) * 4, di = (y * sheet.W + ox + x) * 4; sheet.buf[di] = fr.buf[si]; sheet.buf[di + 1] = fr.buf[si + 1]; sheet.buf[di + 2] = fr.buf[si + 2]; sheet.buf[di + 3] = 255 } })
  writePng('frame.png', sheet)
}

// === all 10 accessories on one dog (current saved state) ===
{
  const ids = Object.keys(ACC_DEF)
  const tiles = ids.map((acc) => makeDog({ base: 'curly-floppy', color: '#c98a5e', eyes: 'dots', muzzle: 'smile', acc }))
  const Wt = tiles[0].W, Ht = tiles[0].H, gap = 12, cols = 5
  const rows = Math.ceil(tiles.length / cols)
  const sheet = { buf: Buffer.alloc((Wt * cols + gap * (cols - 1)) * (Ht * rows + gap * (rows - 1)) * 4), W: Wt * cols + gap * (cols - 1), H: Ht * rows + gap * (rows - 1) }
  tiles.forEach((t, k) => {
    const ox = (k % cols) * (Wt + gap), oy = ((k / cols) | 0) * (Ht + gap)
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const si = (y * Wt + x) * 4, di = ((oy + y) * sheet.W + (ox + x)) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('accessories.png', sheet)
  console.log('accessory order:', ids.join(', '))
}

// === 4 spot patterns on one dog ===
{
  const patterns = ['blobs', 'dots', 'patches', 'splash', 'stripes', 'cheetah', 'hearts', 'stars']
  const tiles = patterns.map((pat) => {
    const base = recolorBase(baseImg('curly-floppy'), '#ead8bd', '#6b4a2f', 11, pat)
    const c = canvasFor(base); placeBase(c, base)
    over(c.buf, c.W, c.H, inkPartImg('eyes-dots'), EYE)
    over(c.buf, c.W, c.H, inkPartImg('muzzle-smile'), MUZ)
    return c
  })
  const Wt = tiles[0].W, Ht = tiles[0].H, gap = 12, cols = 4
  const rows = Math.ceil(tiles.length / cols)
  const sheet = { buf: Buffer.alloc((Wt * cols + gap * (cols - 1)) * (Ht * rows + gap * (rows - 1)) * 4), W: Wt * cols + gap * (cols - 1), H: Ht * rows + gap * (rows - 1) }
  tiles.forEach((t, k) => {
    const ox = (k % cols) * (Wt + gap), oy = ((k / cols) | 0) * (Ht + gap)
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const si = (y * Wt + x) * 4, di = ((oy + y) * sheet.W + (ox + x)) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('spots.png', sheet)
  console.log('spot order:', patterns.join(', '))
}

// === silky re-baked as a PLAIN base (no recolor special-casing) — top curly REF, bottom silky, same colours ===
{
  const colors = ['#c98a5e', '#e0aa55', '#b15a36', '#4b443c', '#5fd0d0', '#e6a0b0']
  const mk = (base) => colors.map((col) => {
    const b = recolorBase(baseImg(base), col, null, 7) // plain recolor — mirrors production
    const c = canvasFor(b); placeBase(c, b)
    over(c.buf, c.W, c.H, inkPartImg('eyes-big'), EYE)
    const mp = muzzlePink('muzzle-tongue')
    over(c.buf, c.W, c.H, mp.part, MUZ, { pink: PINK, mask: mp.mask })
    return c
  })
  const tiles = [...mk('curly-floppy'), ...mk('silky-floppy')]
  const Wt = tiles[0].W, Ht = tiles[0].H, gap = 12, cols = colors.length, rows = 2
  const sheet = { buf: Buffer.alloc((Wt * cols + gap * (cols - 1)) * (Ht * rows + gap * (rows - 1)) * 4), W: Wt * cols + gap * (cols - 1), H: Ht * rows + gap * (rows - 1) }
  tiles.forEach((t, k) => {
    const ox = (k % cols) * (Wt + gap), oy = ((k / cols) | 0) * (Ht + gap)
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const si = (y * Wt + x) * 4, di = ((oy + y) * sheet.W + (ox + x)) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('new-bases.png', sheet)
  console.log('FINAL: top=curly REF, bottom=silky(0.7/0.62):', colors.join(', '))
}

// === new coloured mouths on a dog (drawn as-is, no inkify) ===
{
  const mouths = ['grin', 'fang', 'frown', 'kiss']
  const tiles = mouths.map((mz) => {
    const base = recolorBase(baseImg('curly-floppy'), '#e0aa55', null, 7)
    const c = canvasFor(base); placeBase(c, base)
    over(c.buf, c.W, c.H, inkPartImg('eyes-big'), EYE)
    over(c.buf, c.W, c.H, partImg('muzzle-' + mz), MUZ) // partImg = no inkify -> keeps the pink/tan
    return c
  })
  const Wt = tiles[0].W, Ht = tiles[0].H, gap = 12
  const sheet = { buf: Buffer.alloc((Wt * 4 + gap * 3) * Ht * 4), W: Wt * 4 + gap * 3, H: Ht }
  tiles.forEach((t, k) => {
    const ox = k * (Wt + gap)
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const si = (y * Wt + x) * 4, di = (y * sheet.W + ox + x) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('mouths-dog.png', sheet)
  console.log('mouth order:', mouths.join(', '))
}

// === new coloured eyes on a dog (drawn as-is, no inkify) ===
{
  const eyez = ['heart', 'star', 'angry', 'grumpy']
  const tiles = eyez.map((id) => {
    const base = recolorBase(baseImg('curly-floppy'), '#e0aa55', null, 7)
    const c = canvasFor(base); placeBase(c, base)
    over(c.buf, c.W, c.H, partImg('eyes-' + id), EYE) // partImg = no inkify -> keeps the colours
    over(c.buf, c.W, c.H, inkPartImg('muzzle-smile'), MUZ)
    return c
  })
  const Wt = tiles[0].W, Ht = tiles[0].H, gap = 12
  const sheet = { buf: Buffer.alloc((Wt * 4 + gap * 3) * Ht * 4), W: Wt * 4 + gap * 3, H: Ht }
  tiles.forEach((t, k) => {
    const ox = k * (Wt + gap)
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const si = (y * Wt + x) * 4, di = (y * sheet.W + ox + x) * 4
      sheet.buf[di] = t.buf[si]; sheet.buf[di + 1] = t.buf[si + 1]; sheet.buf[di + 2] = t.buf[si + 2]; sheet.buf[di + 3] = t.buf[si + 3]
    }
  })
  writePng('eyes-dog.png', sheet)
  console.log('eye order:', eyez.join(', '))
}

console.log('done')
