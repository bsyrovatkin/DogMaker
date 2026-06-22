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
  const inFile = path.join(DIR, '_incoming', src + '.png')
  if (!fs.existsSync(inFile)) { console.log('skip', src); continue }
  const png = PNG.sync.read(fs.readFileSync(inFile))
  const { width: w, height: h, data: d } = png
  fs.writeFileSync(path.join(RAW, name + '.png'), fs.readFileSync(inFile)) // keep pristine

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
  fs.writeFileSync(path.join(DIR, name + '.png'), PNG.sync.write(png))
  console.log(name, 'bg removed', removed, 'speckles', speck)
}
console.log('done')
