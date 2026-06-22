// Bake transparency into the "silky" (very wispy, no closed outline) bases whose background is a
// white(~254)+gray(~242) CHECKERBOARD almost the same value as the flat body fill (~238).
// A plain threshold can't separate them, so we use STRUCTURE: a light pixel is background only if a
// pure-white (>248) pixel sits within R px of it (the checker always pairs white+gray squares),
// while the flat body has no pure-white nearby. Dark fur strands (value<228) are always kept.
const fs = require('fs'), path = require('path'), { PNG } = require('pngjs')
const DIR = 'D:/Projects/DogMaker/public/bases'
const RAW = path.join(DIR, '_raw')
if (!fs.existsSync(RAW)) fs.mkdirSync(RAW)
const map = { 'nf-1': 'silky-floppy', 'nf-2': 'silky-spaniel', 'nf-3': 'silky-round', 'nf-4': 'silky-pointy' }
const R = 11        // dilation radius (~ checker cell) — also the body-edge erosion in px
const WHITE = 248   // pure checker white
const LIGHT = 228   // below this = fur ink, always kept

for (const [src, name] of Object.entries(map)) {
  // pristine source: _raw/<name>.png (kept) preferred; else the fresh _incoming/<src>.png
  const rawFile = path.join(RAW, name + '.png')
  const inFile = fs.existsSync(rawFile) ? rawFile : path.join(DIR, '_incoming', src + '.png')
  if (!fs.existsSync(inFile)) { console.log('skip', src); continue }
  const png = PNG.sync.read(fs.readFileSync(inFile))
  const { width: w, height: h, data: d } = png
  if (!fs.existsSync(rawFile)) fs.writeFileSync(rawFile, fs.readFileSync(inFile)) // keep pristine

  const val = (p) => { const i = p * 4; return Math.min(d[i], d[i + 1], d[i + 2]) }
  // pure-white pixels...
  const pw = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) pw[p] = val(p) > WHITE ? 1 : 0
  // ...but only keep white that belongs to a LARGE block (a checker square). The body's tiny
  // between-fur white specks form small components and are ignored, so the body survives.
  const white = new Uint8Array(w * h)
  {
    const lab = new Int32Array(w * h)
    for (let s = 0; s < w * h; s++) {
      if (lab[s] || !pw[s]) continue
      const stack = [s], mem = [s]; lab[s] = 1
      while (stack.length) {
        const q = stack.pop(), x = q % w, y = (q / w) | 0
        if (x + 1 < w && !lab[q + 1] && pw[q + 1]) { lab[q + 1] = 1; stack.push(q + 1); mem.push(q + 1) }
        if (x > 0 && !lab[q - 1] && pw[q - 1]) { lab[q - 1] = 1; stack.push(q - 1); mem.push(q - 1) }
        if (y + 1 < h && !lab[q + w] && pw[q + w]) { lab[q + w] = 1; stack.push(q + w); mem.push(q + w) }
        if (y > 0 && !lab[q - w] && pw[q - w]) { lab[q - w] = 1; stack.push(q - w); mem.push(q - w) }
      }
      if (mem.length >= 40) for (const q of mem) white[q] = 1 // checker square
    }
  }

  // separable dilation of the white mask by radius R
  const hd = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    let cnt = 0
    for (let x = 0; x <= R && x < w; x++) cnt += white[y * w + x]
    for (let x = 0; x < w; x++) {
      hd[y * w + x] = cnt > 0 ? 1 : 0
      const add = x + R + 1, rem = x - R
      if (add < w) cnt += white[y * w + add]
      if (rem >= 0) cnt -= white[y * w + rem]
    }
  }
  const wd = new Uint8Array(w * h)
  for (let x = 0; x < w; x++) {
    let cnt = 0
    for (let y = 0; y <= R && y < h; y++) cnt += hd[y * w + x]
    for (let y = 0; y < h; y++) {
      wd[y * w + x] = cnt > 0 ? 1 : 0
      const add = y + R + 1, rem = y - R
      if (add < h) cnt += hd[(add) * w + x]
      if (rem >= 0) cnt -= hd[(rem) * w + x]
    }
  }

  let removed = 0
  for (let p = 0; p < w * h; p++) {
    if (val(p) > LIGHT && wd[p]) { d[p * 4 + 3] = 0; removed++ }
  }

  // drop tiny stray opaque speckles (keep all sizeable parts)
  const lab = new Int32Array(w * h); let cur = 0, speck = 0
  for (let s = 0; s < w * h; s++) {
    if (lab[s] || d[s * 4 + 3] < 40) continue
    cur++; const stack = [s]; lab[s] = cur; const mem = [s]
    while (stack.length) {
      const q = stack.pop(), x = q % w, y = (q / w) | 0
      const nb = []
      if (x + 1 < w) nb.push(q + 1); if (x > 0) nb.push(q - 1); if (y + 1 < h) nb.push(q + w); if (y > 0) nb.push(q - w)
      for (const r of nb) if (!lab[r] && d[r * 4 + 3] >= 40) { lab[r] = cur; stack.push(r); mem.push(r) }
    }
    if (mem.length < 250) { for (const q of mem) d[q * 4 + 3] = 0; speck += mem.length }
  }

  // fill enclosed transparent HOLES (the white speckles where checker pockets were punched out
  // inside the body) with the body fill, so the recolour tints them instead of showing the page.
  const ext = new Uint8Array(w * h); const es = []
  const trans = (p) => d[p * 4 + 3] < 40
  for (let x = 0; x < w; x++) { if (trans(x)) { ext[x] = 1; es.push(x) } const b = (h - 1) * w + x; if (trans(b)) { ext[b] = 1; es.push(b) } }
  for (let y = 0; y < h; y++) { const l = y * w; if (trans(l)) { ext[l] = 1; es.push(l) } const r = y * w + w - 1; if (trans(r)) { ext[r] = 1; es.push(r) } }
  while (es.length) {
    const q = es.pop(), x = q % w, y = (q / w) | 0
    if (x + 1 < w && !ext[q + 1] && trans(q + 1)) { ext[q + 1] = 1; es.push(q + 1) }
    if (x > 0 && !ext[q - 1] && trans(q - 1)) { ext[q - 1] = 1; es.push(q - 1) }
    if (y + 1 < h && !ext[q + w] && trans(q + w)) { ext[q + w] = 1; es.push(q + w) }
    if (y > 0 && !ext[q - w] && trans(q - w)) { ext[q - w] = 1; es.push(q - w) }
  }
  let filled = 0
  for (let p = 0; p < w * h; p++) {
    if (trans(p) && !ext[p]) { const i = p * 4; d[i] = 236; d[i + 1] = 236; d[i + 2] = 236; d[i + 3] = 255; filled++ }
  }
  // SOLID SILHOUETTE fill: bound the dog by its dark fur strands (dilated into a closed ring),
  // then fill everything inside that's still transparent — so sparse fur over checker (the chest)
  // becomes a solid body instead of see-through speckles, while the outer fur stays wispy.
  {
    const D = 22
    const winMax = (src) => {
      const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h)
      for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x <= D && x < w; x++) c += src[y * w + x]; for (let x = 0; x < w; x++) { tmp[y * w + x] = c > 0 ? 1 : 0; const a = x + D + 1, r = x - D; if (a < w) c += src[y * w + a]; if (r >= 0) c -= src[y * w + r] } }
      for (let x = 0; x < w; x++) { let c = 0; for (let y = 0; y <= D && y < h; y++) c += tmp[y * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = c > 0 ? 1 : 0; const a = y + D + 1, r = y - D; if (a < h) c += tmp[a * w + x]; if (r >= 0) c -= tmp[r * w + x] } }
      return out
    }
    const ink = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) ink[p] = val(p) < 185 ? 1 : 0
    const ring = winMax(ink) // dilated dark strands -> a closed-ish boundary around the dog
    const seen = new Uint8Array(w * h), st2 = []
    const pass = (p) => !ring[p] // exterior can travel only outside the boundary ring
    for (let x = 0; x < w; x++) { if (pass(x)) { seen[x] = 1; st2.push(x) } const b = (h - 1) * w + x; if (pass(b)) { seen[b] = 1; st2.push(b) } }
    for (let y = 0; y < h; y++) { const l = y * w; if (pass(l)) { seen[l] = 1; st2.push(l) } const r = y * w + w - 1; if (pass(r)) { seen[r] = 1; st2.push(r) } }
    while (st2.length) {
      const q = st2.pop(), x = q % w, y = (q / w) | 0
      if (x + 1 < w && !seen[q + 1] && pass(q + 1)) { seen[q + 1] = 1; st2.push(q + 1) }
      if (x > 0 && !seen[q - 1] && pass(q - 1)) { seen[q - 1] = 1; st2.push(q - 1) }
      if (y + 1 < h && !seen[q + w] && pass(q + w)) { seen[q + w] = 1; st2.push(q + w) }
      if (y > 0 && !seen[q - w] && pass(q - w)) { seen[q - w] = 1; st2.push(q - w) }
    }
    for (let p = 0; p < w * h; p++) {
      if (!seen[p] && d[p * 4 + 3] < 40) { const i = p * 4; d[i] = 236; d[i + 1] = 236; d[i + 2] = 236; d[i + 3] = 255; filled++ }
    }
  }
  console.log(name, '— holes filled', filled)
  fs.writeFileSync(path.join(DIR, name + '.png'), PNG.sync.write(png))
  console.log(name, 'bg removed', removed, 'speckles', speck)
}
console.log('done')
