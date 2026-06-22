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

  // Fill INTERIOR transparent pockets (the chest see-through specks) with the body fill, but leave the
  // wispy OUTER gaps transparent. A pixel is interior iff it has opaque fur on ALL four sides (left,
  // right, up AND down): true for a hole surrounded by the body, false for the outermost fringe where
  // the outward side opens onto the page. This can never fill past the drawn strands — no halo, no
  // hard webbing across the wispy edge — while still closing the speckles deep in the body.
  let filled = 0
  {
    const op = (p) => d[p * 4 + 3] >= 40
    const L = new Uint8Array(w * h), R = new Uint8Array(w * h), U = new Uint8Array(w * h), Dn = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) {
      let s = 0; for (let x = 0; x < w; x++) { const p = y * w + x; L[p] = s; if (op(p)) s = 1 }
      s = 0; for (let x = w - 1; x >= 0; x--) { const p = y * w + x; R[p] = s; if (op(p)) s = 1 }
    }
    for (let x = 0; x < w; x++) {
      let s = 0; for (let y = 0; y < h; y++) { const p = y * w + x; U[p] = s; if (op(p)) s = 1 }
      s = 0; for (let y = h - 1; y >= 0; y--) { const p = y * w + x; Dn[p] = s; if (op(p)) s = 1 }
    }
    for (let p = 0; p < w * h; p++) {
      if (d[p * 4 + 3] < 40 && L[p] && R[p] && U[p] && Dn[p]) { const i = p * 4; d[i] = 236; d[i + 1] = 236; d[i + 2] = 236; d[i + 3] = 255; filled++ }
    }
  }
  // Tone-map to a normal grayscale fur base. The sketch is near-white (body ~236), so it would recolour
  // far PALER than the other furs (whose mid-grey bodies multiply the coat down). Multiply the whole
  // opaque dog to a mid-tone: the body now recolours as richly as curly/shaggy, AND the mid strands drop
  // below the standard ink threshold so they read as crisp dark fur lines. Result: silky is a PLAIN base
  // that needs NO special-casing in recolor(). 0.7 was matched against the curly reference.
  for (let p = 0; p < w * h; p++) {
    if (d[p * 4 + 3] < 40) continue
    const i = p * 4
    d[i] = Math.round(d[i] * 0.7); d[i + 1] = Math.round(d[i + 1] * 0.7); d[i + 2] = Math.round(d[i + 2] * 0.7)
  }
  console.log(name, '— holes filled', filled)
  fs.writeFileSync(path.join(DIR, name + '.png'), PNG.sync.write(png))
  console.log(name, 'bg removed', removed, 'speckles', speck)
}
console.log('done')
