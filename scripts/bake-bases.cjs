// Bake transparency into the base PNGs: the generator left an OPAQUE near-white background.
// Flood-fill that background from the borders -> alpha 0 (RGB kept for soft edges). The dog's
// closed outline stops the flood. Idempotent: always reads the pristine source from _raw/.
// shaggy-floppy's light wispy coat connects to the bg, so it needs a higher (stricter) white
// threshold to avoid leaking into the body.
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const DIR = 'D:/Projects/DogMaker/public/bases'
const RAW = path.join(DIR, '_raw')
if (!fs.existsSync(RAW)) fs.mkdirSync(RAW)

const FURS = ['curly', 'shaggy', 'smooth', 'fluffy', 'dreads', 'silky']
const EARS = ['floppy', 'pointy', 'round', 'spaniel']
// only the combos that actually exist as files get baked; the rest are skipped
const COMBOS = [
  'curly-floppy', 'curly-pointy', 'curly-round', 'curly-spaniel',
  'shaggy-floppy', 'shaggy-pointy', 'shaggy-round', 'shaggy-spaniel',
  'smooth-floppy', 'smooth-pointy', 'smooth-round', 'smooth-spaniel',
  'fluffy-floppy', 'fluffy-pointy', 'fluffy-round', 'fluffy-spaniel',
  'dreads-floppy', 'dreads-pointy', 'dreads-round', 'dreads-spaniel',
  'silky-floppy', 'silky-pointy', 'silky-round', 'silky-spaniel',
]
// silky's sketch sits on a white(254)+grey checkerboard. On floppy/round/spaniel the grey square (~241)
// is lighter than the body (~237), so a strict 240 cleanly removes both checker colours and keeps the
// solid body (no holes -> no fill -> nothing can bleed past the strands).
const THRESH = { 'shaggy-floppy': 245, 'silky-floppy': 240, 'silky-round': 240, 'silky-spaniel': 240, 'silky-pointy': 240 }
const DEFAULT_T = 232
// optional per-fur tone-map: silky's near-white body would recolour far paler than the grey-bodied
// furs, so darken it to a mid-tone after the bg is removed (matches curly/shaggy richness).
const TONE = { silky: 0.72 }

for (const fur of FURS) for (const ears of EARS) {
  if (!COMBOS.includes(`${fur}-${ears}`)) continue
  const name = `${fur}-${ears}.png`
  const dst = path.join(DIR, name)
  const rawFile = path.join(RAW, name)
  // ensure a pristine source exists in _raw, then always bake from it
  if (!fs.existsSync(rawFile)) {
    if (!fs.existsSync(dst)) { console.log('skip (missing)', name); continue }
    fs.copyFileSync(dst, rawFile)
  }
  const png = PNG.sync.read(fs.readFileSync(rawFile))
  const { width: w, height: h, data: d } = png
  const T = THRESH[`${fur}-${ears}`] ?? DEFAULT_T
  const isBg = (p) => { const i = p * 4; return d[i] > T && d[i + 1] > T && d[i + 2] > T }
  const seen = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w)
  for (let y = 0; y < h; y++) st.push(y * w, w - 1 + y * w)
  let removed = 0
  while (st.length) {
    const p = st.pop()
    if (seen[p]) continue
    seen[p] = 1
    if (!isBg(p)) continue
    d[p * 4 + 3] = 0; removed++
    const x = p % w, y = (p / w) | 0
    if (x + 1 < w) st.push(p + 1)
    if (x > 0) st.push(p - 1)
    if (y + 1 < h) st.push(p + w)
    if (y > 0) st.push(p - w)
  }
  // cleanup: keep only the largest opaque component (the dog); drop stray near-white speckles
  const lab = new Int32Array(w * h)
  let best = 0, bestArea = 0, cur = 0
  for (let s = 0; s < w * h; s++) {
    if (lab[s] || d[s * 4 + 3] < 40) continue
    cur++; let area = 0; const stack = [s]; lab[s] = cur
    while (stack.length) {
      const p = stack.pop(); area++
      const x = p % w, y = (p / w) | 0
      if (x + 1 < w && !lab[p + 1] && d[(p + 1) * 4 + 3] >= 40) { lab[p + 1] = cur; stack.push(p + 1) }
      if (x > 0 && !lab[p - 1] && d[(p - 1) * 4 + 3] >= 40) { lab[p - 1] = cur; stack.push(p - 1) }
      if (y + 1 < h && !lab[p + w] && d[(p + w) * 4 + 3] >= 40) { lab[p + w] = cur; stack.push(p + w) }
      if (y > 0 && !lab[p - w] && d[(p - w) * 4 + 3] >= 40) { lab[p - w] = cur; stack.push(p - w) }
    }
    if (area > bestArea) { bestArea = area; best = cur }
  }
  let speck = 0
  for (let s = 0; s < w * h; s++) if (d[s * 4 + 3] >= 40 && lab[s] !== best) { d[s * 4 + 3] = 0; speck++ }

  // optional tone-map (silky): darken the surviving opaque dog so its near-white body recolours richly
  const tone = TONE[fur]
  if (tone) for (let s = 0; s < w * h; s++) { if (d[s * 4 + 3] < 40) continue; const i = s * 4; d[i] = Math.round(d[i] * tone); d[i + 1] = Math.round(d[i + 1] * tone); d[i + 2] = Math.round(d[i + 2] * tone) }

  fs.writeFileSync(dst, PNG.sync.write(png))
  console.log(name, 'T=' + T, 'transparent px', removed, 'speckles removed', speck, '/', w * h)
}
console.log('done — pristine originals kept in public/bases/_raw/')
