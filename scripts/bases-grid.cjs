// Render all 12 baked bases as flat caramel silhouettes to spot flood-leak holes.
const fs = require('fs'), { PNG } = require('pngjs'), path = require('path')
const D = 'D:/Projects/DogMaker/public/bases'
const furs = ['curly', 'shaggy', 'smooth', 'fluffy', 'dreads'], ears = ['floppy', 'pointy', 'round', 'spaniel']
const TW = 120
const samp = (d, w, h, x, y) => { x = Math.max(0, Math.min(w - 1, Math.round(x))); y = Math.max(0, Math.min(h - 1, Math.round(y))); const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]] }
const sheet = new PNG({ width: ears.length * TW, height: furs.length * TW })
furs.forEach((fur, r) => {
  ears.forEach((ear, c) => {
    const p = PNG.sync.read(fs.readFileSync(path.join(D, `${fur}-${ear}.png`)))
    const { width: w, height: h, data: d } = p
    for (let y = 0; y < TW; y++) for (let x = 0; x < TW; x++) {
      const s = samp(d, w, h, x * w / TW, y * h / TW)
      const di = ((r * TW + y) * sheet.width + (c * TW + x)) * 4
      if (s[3] < 40) { sheet.data[di + 3] = 0; continue }
      const sh = (0.299 * s[0] + 0.587 * s[1] + 0.114 * s[2]) / 255
      sheet.data[di] = 169 * sh; sheet.data[di + 1] = 113 * sh; sheet.data[di + 2] = 63 * sh; sheet.data[di + 3] = 255
    }
  })
})
fs.writeFileSync('D:/Projects/DogMaker/qa-out/bases-grid.png', PNG.sync.write(sheet))
console.log('grid: cols=floppy,pointy,round; rows=curly,shaggy,smooth,fluffy')
