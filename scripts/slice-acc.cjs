// Slice an accessory sheet with an OPAQUE white background into individual transparent PNGs.
// 1) flood-fill the white background from the borders -> transparent
// 2) connected-components on what remains -> one blob per accessory
// 3) crop each blob to its own transparent PNG
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const dir = 'D:/Projects/DogMaker/public/parts'
const input = process.argv[2] || '_acc-sheet.png'
const prefix = process.argv[3] || 'acc'
const png = PNG.sync.read(fs.readFileSync(path.join(dir, input)))
const { width: W, height: H, data } = png
const WHITE = 233
const A_T = 50
const MIN_AREA = +(process.argv[4] || 1500)

const isBg = (p) => {
  const i = p * 4
  if (data[i + 3] < A_T) return true
  return data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE
}

// 1) flood-fill background from the borders
{
  const seen = new Uint8Array(W * H)
  const stack = []
  for (let x = 0; x < W; x++) { stack.push(x, x + (H - 1) * W) }
  for (let y = 0; y < H; y++) { stack.push(y * W, W - 1 + y * W) }
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    if (!isBg(p)) continue
    data[p * 4 + 3] = 0
    const x = p % W, y = (p / W) | 0
    if (x + 1 < W) stack.push(p + 1)
    if (x > 0) stack.push(p - 1)
    if (y + 1 < H) stack.push(p + W)
    if (y > 0) stack.push(p - W)
  }
}

// 2) connected components on remaining opaque pixels
const labels = new Int32Array(W * H)
const comps = []
let next = 0
for (let i = 0; i < W * H; i++) {
  if (labels[i] !== 0) continue
  if (data[i * 4 + 3] < A_T) { labels[i] = -1; continue }
  next++
  let minX = W, minY = H, maxX = 0, maxY = 0, area = 0
  const stack = [i]
  labels[i] = next
  while (stack.length) {
    const p = stack.pop()
    const x = p % W, y = (p / W) | 0
    area++
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    const nb = []
    if (x + 1 < W) nb.push(p + 1)
    if (x > 0) nb.push(p - 1)
    if (y + 1 < H) nb.push(p + W)
    if (y > 0) nb.push(p - W)
    for (const q of nb) {
      if (labels[q] === 0) {
        if (data[q * 4 + 3] >= A_T) { labels[q] = next; stack.push(q) }
        else labels[q] = -1
      }
    }
  }
  comps.push({ minX, minY, maxX, maxY, area })
}

const big = comps.filter((c) => c.area > MIN_AREA)
big.sort((a, b) => (a.minY + a.maxY) - (b.minY + b.maxY) || a.minX - b.minX)
console.log('components:', big.length)

big.forEach((c, k) => {
  const m = 10
  const x0 = Math.max(0, c.minX - m), y0 = Math.max(0, c.minY - m)
  const x1 = Math.min(W - 1, c.maxX + m), y1 = Math.min(H - 1, c.maxY + m)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new PNG({ width: cw, height: ch })
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const sp = ((y0 + y) * W + (x0 + x)) * 4
      const dp = (y * cw + x) * 4
      out.data[dp] = data[sp]
      out.data[dp + 1] = data[sp + 1]
      out.data[dp + 2] = data[sp + 2]
      out.data[dp + 3] = data[sp + 3]
    }
  }
  const name = prefix + '-' + String(k + 1).padStart(2, '0') + '.png'
  fs.writeFileSync(path.join(dir, name), PNG.sync.write(out))
  console.log(name, 'pos', c.minX, c.minY, 'size', c.maxX - c.minX, c.maxY - c.minY, 'area', c.area)
})
console.log('done')
