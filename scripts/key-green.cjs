// Chroma-key a green background out of the 4 new (already-coloured) mouth parts.
// 1) flood-fill the green from the borders -> transparent
// 2) despill: clamp any green-dominant edge pixel so no green fringe remains
// 3) crop to content with a small margin, write muzzle-<name>.png
const fs = require('fs'), path = require('path'), { PNG } = require('pngjs')
const dir = 'D:/Projects/DogMaker/public/parts'
const map = { 'm-1': 'kiss', 'm-2': 'grin', 'm-3': 'fang', 'm-4': 'frown' }

for (const [src, name] of Object.entries(map)) {
  const png = PNG.sync.read(fs.readFileSync(path.join(dir, '_incoming', src + '.png')))
  const { width: W, height: H, data: d } = png
  const isGreen = (p) => { const i = p * 4; const r = d[i], g = d[i + 1], b = d[i + 2]; return d[i + 3] > 40 && g > r * 1.25 + 8 && g > b * 1.25 + 8 && g > 80 }

  // 1) flood green from the borders
  const seen = new Uint8Array(W * H), st = []
  for (let x = 0; x < W; x++) st.push(x, x + (H - 1) * W)
  for (let y = 0; y < H; y++) st.push(y * W, W - 1 + y * W)
  while (st.length) {
    const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!isGreen(p)) continue
    d[p * 4 + 3] = 0
    const x = p % W, y = (p / W) | 0
    if (x + 1 < W) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < H) st.push(p + W); if (y > 0) st.push(p - W)
  }
  // 2) despill — clamp green where it's the dominant channel (kills the anti-alias fringe)
  let despilled = 0
  for (let p = 0; p < W * H; p++) {
    const i = p * 4; if (d[i + 3] === 0) continue
    const mx = Math.max(d[i], d[i + 2])
    if (d[i + 1] > mx) { d[i + 1] = mx; despilled++ }
    // a pixel that's still clearly green after flood (isolated) -> drop it
    if (isGreen(p)) d[i + 3] = 0
  }
  // 3) crop to content
  let minX = W, minY = H, maxX = 0, maxY = 0, found = false
  for (let p = 0; p < W * H; p++) if (d[p * 4 + 3] > 30) { found = true; const x = p % W, y = (p / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
  const m = 12
  const x0 = Math.max(0, minX - m), y0 = Math.max(0, minY - m), x1 = Math.min(W - 1, maxX + m), y1 = Math.min(H - 1, maxY + m)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new PNG({ width: cw, height: ch })
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const sp = ((y0 + y) * W + (x0 + x)) * 4, dp = (y * cw + x) * 4
    out.data[dp] = d[sp]; out.data[dp + 1] = d[sp + 1]; out.data[dp + 2] = d[sp + 2]; out.data[dp + 3] = d[sp + 3]
  }
  fs.writeFileSync(path.join(dir, 'muzzle-' + name + '.png'), PNG.sync.write(out))
  console.log('muzzle-' + name, found ? cw + 'x' + ch : 'EMPTY', 'despilled', despilled)
}
console.log('done')
