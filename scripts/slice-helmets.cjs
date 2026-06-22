// Slice the helmet sheet (_acc-sheet3.png) whose "transparent" bg is a baked white+gray
// CHECKERBOARD, and whose helmets have an open face-hole (also checkerboard) that must go clear.
// 1) checkerboard removal: connected light-gray/white regions that touch the border OR are
//    >12% flat checker-gray (237) -> transparent. A SOLID white helmet body (no 237) survives.
// 2) connected components on what remains -> one helmet each, cropped.
// 3) erode the near-white edge fringe (clean white edges), keeping enclosed light fills.
const fs = require('fs'), path = require('path'), { PNG } = require('pngjs')
const dir = 'D:/Projects/DogMaker/public/parts'
const png = PNG.sync.read(fs.readFileSync(path.join(dir, '_acc-sheet3.png')))
const { width: W, height: H, data: d } = png

const isGray = (p) => { const i = p * 4; return Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 16 }
const val = (p) => { const i = p * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3 }
const lightbg = (p) => d[p * 4 + 3] >= 200 && isGray(p) && val(p) > 224
const checkerGray = (p) => isGray(p) && val(p) >= 228 && val(p) <= 246

// ---- 1) remove the checkerboard (and the enclosed face-holes) ----
const lab = new Int32Array(W * H)
const comps = [{}]
let cur = 0
for (let s = 0; s < W * H; s++) {
  if (lab[s] || !lightbg(s)) continue
  cur++; const stack = [s]; lab[s] = cur; let area = 0, grayN = 0, border = false
  while (stack.length) {
    const p = stack.pop(); area++; if (checkerGray(p)) grayN++
    const x = p % W, y = (p / W) | 0
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true
    if (x + 1 < W && !lab[p + 1] && lightbg(p + 1)) { lab[p + 1] = cur; stack.push(p + 1) }
    if (x > 0 && !lab[p - 1] && lightbg(p - 1)) { lab[p - 1] = cur; stack.push(p - 1) }
    if (y + 1 < H && !lab[p + W] && lightbg(p + W)) { lab[p + W] = cur; stack.push(p + W) }
    if (y > 0 && !lab[p - W] && lightbg(p - W)) { lab[p - W] = cur; stack.push(p - W) }
  }
  comps[cur] = { area, grayN, border }
}
let removed = 0
for (let s = 0; s < W * H; s++) {
  const c = lab[s]
  if (c && (comps[c].border || comps[c].grayN / comps[c].area > 0.12)) { d[s * 4 + 3] = 0; removed++ }
}
console.log('checkerboard px removed', removed)

// ---- 2) connected components on opaque accessories ----
const A_T = 60, MIN_AREA = 4000
const lab2 = new Int32Array(W * H)
const blobs = []
let n2 = 0
for (let s = 0; s < W * H; s++) {
  if (lab2[s] || d[s * 4 + 3] < A_T) continue
  n2++; const stack = [s]; lab2[s] = n2
  let minX = W, minY = H, maxX = 0, maxY = 0, area = 0
  while (stack.length) {
    const p = stack.pop(); area++
    const x = p % W, y = (p / W) | 0
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y
    if (x + 1 < W && !lab2[p + 1] && d[(p + 1) * 4 + 3] >= A_T) { lab2[p + 1] = n2; stack.push(p + 1) }
    if (x > 0 && !lab2[p - 1] && d[(p - 1) * 4 + 3] >= A_T) { lab2[p - 1] = n2; stack.push(p - 1) }
    if (y + 1 < H && !lab2[p + W] && d[(p + W) * 4 + 3] >= A_T) { lab2[p + W] = n2; stack.push(p + W) }
    if (y > 0 && !lab2[p - W] && d[(p - W) * 4 + 3] >= A_T) { lab2[p - W] = n2; stack.push(p - W) }
  }
  blobs.push({ id: n2, minX, minY, maxX, maxY, area })
}
const big = blobs.filter((b) => b.area > MIN_AREA).sort((a, b) => (a.minY + a.maxY) - (b.minY + b.maxY) || a.minX - b.minX)
console.log('accessories found', big.length)

// ---- 3) crop + erode near-white fringe ----
const erodeFringe = (out) => {
  const { width: w, height: h, data: e } = out
  const nearWhite = (p) => { const i = p * 4; return e[i + 3] >= 40 && e[i] > 205 && e[i + 1] > 205 && e[i + 2] > 205 }
  const trans = (p) => e[p * 4 + 3] < 40
  for (let it = 0; it < 2; it++) {
    const clear = []
    for (let p = 0; p < w * h; p++) {
      if (!nearWhite(p)) continue
      const x = p % w, y = (p / w) | 0
      if ((x + 1 >= w || trans(p + 1)) || (x - 1 < 0 || trans(p - 1)) || (y + 1 >= h || trans(p + w)) || (y - 1 < 0 || trans(p - w))) clear.push(p)
    }
    for (const p of clear) e[p * 4 + 3] = 0
  }
}

big.forEach((b, k) => {
  const m = 10
  const x0 = Math.max(0, b.minX - m), y0 = Math.max(0, b.minY - m)
  const x1 = Math.min(W - 1, b.maxX + m), y1 = Math.min(H - 1, b.maxY + m)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new PNG({ width: cw, height: ch })
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const sp = ((y0 + y) * W + (x0 + x)) * 4, dp = (y * cw + x) * 4
    // only copy pixels that belong to THIS blob (avoid neighbour bleed)
    const keep = lab2[(y0 + y) * W + (x0 + x)] === b.id
    out.data[dp] = d[sp]; out.data[dp + 1] = d[sp + 1]; out.data[dp + 2] = d[sp + 2]; out.data[dp + 3] = keep ? d[sp + 3] : 0
  }
  erodeFringe(out)
  const name = 'helmet-' + (k + 1) + '.png'
  fs.writeFileSync(path.join(dir, name), PNG.sync.write(out))
  console.log(name, 'pos', b.minX, b.minY, 'size', b.maxX - b.minX, b.maxY - b.minY, 'area', b.area)
})
console.log('done')
