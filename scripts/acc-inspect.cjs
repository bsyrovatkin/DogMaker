// Composite a few accessories over a solid colour to reveal white edge speckles / fringe.
const fs = require('fs'), { PNG } = require('pngjs'), path = require('path')
const DIR = 'D:/Projects/DogMaker/public/parts'
const names = ['acc-wings', 'acc-glasses', 'acc-crown', 'acc-partyhat', 'acc-bow', 'acc-tie']
const BG = [38, 111, 111] // teal
const PAD = 14, GAP = 16

const imgs = names.map((n) => PNG.sync.read(fs.readFileSync(path.join(DIR, n + '.png'))))
const cellW = Math.max(...imgs.map((p) => p.width)) + PAD * 2
const cellH = Math.max(...imgs.map((p) => p.height)) + PAD * 2
const cols = 2, rows = Math.ceil(imgs.length / cols)
const W = cols * cellW + (cols - 1) * GAP, H = rows * cellH + (rows - 1) * GAP
const out = new PNG({ width: W, height: H })
for (let i = 0; i < W * H; i++) { out.data[i * 4] = BG[0]; out.data[i * 4 + 1] = BG[1]; out.data[i * 4 + 2] = BG[2]; out.data[i * 4 + 3] = 255 }

imgs.forEach((p, k) => {
  const ox = (k % cols) * (cellW + GAP) + PAD, oy = ((k / cols) | 0) * (cellH + GAP) + PAD
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const a = p.data[(y * p.width + x) * 4 + 3] / 255
    if (a === 0) continue
    const di = ((oy + y) * W + (ox + x)) * 4, si = (y * p.width + x) * 4
    out.data[di] = p.data[si] * a + BG[0] * (1 - a)
    out.data[di + 1] = p.data[si + 1] * a + BG[1] * (1 - a)
    out.data[di + 2] = p.data[si + 2] * a + BG[2] * (1 - a)
    out.data[di + 3] = 255
  }
})
fs.writeFileSync('D:/Projects/DogMaker/qa-out/acc-inspect.png', PNG.sync.write(out))
console.log('inspect:', names.join(', '))
