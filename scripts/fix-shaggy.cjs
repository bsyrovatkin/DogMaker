// Find a white threshold that removes shaggy-floppy's bg WITHOUT leaking into its light coat.
const fs = require('fs'), { PNG } = require('pngjs')
const RAW = 'D:/Projects/DogMaker/public/bases/_raw/shaggy-floppy.png'
const raw = fs.readFileSync(RAW)

function flood(T) {
  const png = PNG.sync.read(raw)
  const { width: w, height: h, data: d } = png
  const isBg = (p) => { const i = p * 4; return d[i] > T && d[i + 1] > T && d[i + 2] > T }
  const seen = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w)
  for (let y = 0; y < h; y++) st.push(y * w, w - 1 + y * w)
  let rm = 0
  while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!isBg(p)) continue; d[p * 4 + 3] = 0; rm++; const x = p % w, y = (p / w) | 0; if (x + 1 < w) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < h) st.push(p + w); if (y > 0) st.push(p - w) }
  const A = (x, y) => d[((y * w + x) * 4) + 3]
  return { png, w, h, rm, center: A(w >> 1, h >> 1), chest: A(w >> 1, (h * 0.45) | 0), belly: A(w >> 1, (h * 0.6) | 0), corner: A(3, 3), bgEdge: A((w * 0.5) | 0, 4) }
}

for (const T of [232, 240, 245, 248, 250, 252]) {
  const r = flood(T)
  console.log('T=' + T, 'removed', r.rm, 'center', r.center, 'chest', r.chest, 'belly', r.belly, 'corner', r.corner, 'topEdge', r.bgEdge)
}
