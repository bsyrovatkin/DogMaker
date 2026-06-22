// Clean the white anti-alias fringe / speckles on accessory OUTER contours.
// - erodes near-white pixels that touch the transparent background (the outer halo)
// - removes tiny stray components (speckles), keeping all large parts (wings = 2 parts!)
// - never touches enclosed light fills (pompom, scarf stripes, bandana dots, cream wings),
//   because those don't touch the transparent background.
// Idempotent: bakes from a pristine copy kept in public/parts/_acc-raw/.
const fs = require('fs'), path = require('path'), { PNG } = require('pngjs')

const DIR = 'D:/Projects/DogMaker/public/parts'
const RAW = path.join(DIR, '_acc-raw')
if (!fs.existsSync(RAW)) fs.mkdirSync(RAW)

const ACCS = ['beanie', 'partyhat', 'crown', 'bow', 'glasses', 'bandana', 'collar', 'scarf', 'tie', 'wings']
const A_T = 40        // alpha considered "present"
const NW = 205        // min channel to count as near-white (the light fringe / fills)
const EROSIONS = 2    // fringe thickness to peel
const MIN_AREA = 140  // drop opaque components smaller than this (speckles)

for (const name of ACCS) {
  const file = path.join(DIR, 'acc-' + name + '.png')
  const raw = path.join(RAW, 'acc-' + name + '.png')
  if (!fs.existsSync(raw)) { if (!fs.existsSync(file)) { console.log('skip', name); continue } fs.copyFileSync(file, raw) }
  const png = PNG.sync.read(fs.readFileSync(raw))
  const { width: w, height: h, data: d } = png
  const trans = (p) => d[p * 4 + 3] < A_T
  const nearWhite = (p) => { const i = p * 4; return d[i + 3] >= A_T && d[i] > NW && d[i + 1] > NW && d[i + 2] > NW }

  // 1) erode the near-white fringe touching transparent, a few passes
  let eroded = 0
  for (let it = 0; it < EROSIONS; it++) {
    const clear = []
    for (let p = 0; p < w * h; p++) {
      if (!nearWhite(p)) continue
      const x = p % w, y = (p / w) | 0
      if ((x + 1 >= w || trans(p + 1)) || (x - 1 < 0 || trans(p - 1)) || (y + 1 >= h || trans(p + w)) || (y - 1 < 0 || trans(p - w))) clear.push(p)
    }
    for (const p of clear) d[p * 4 + 3] = 0
    eroded += clear.length
  }

  // 2) remove tiny stray components (speckles); keep every component >= MIN_AREA (both wings survive)
  const lab = new Int32Array(w * h)
  let cur = 0, specks = 0
  for (let s = 0; s < w * h; s++) {
    if (lab[s] || trans(s)) continue
    cur++; const stack = [s]; lab[s] = cur; const members = [s]
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p / w) | 0
      if (x + 1 < w && !lab[p + 1] && !trans(p + 1)) { lab[p + 1] = cur; stack.push(p + 1); members.push(p + 1) }
      if (x > 0 && !lab[p - 1] && !trans(p - 1)) { lab[p - 1] = cur; stack.push(p - 1); members.push(p - 1) }
      if (y + 1 < h && !lab[p + w] && !trans(p + w)) { lab[p + w] = cur; stack.push(p + w); members.push(p + w) }
      if (y > 0 && !lab[p - w] && !trans(p - w)) { lab[p - w] = cur; stack.push(p - w); members.push(p - w) }
    }
    if (members.length < MIN_AREA) { for (const p of members) d[p * 4 + 3] = 0; specks += members.length }
  }

  fs.writeFileSync(file, PNG.sync.write(png))
  console.log('acc-' + name, 'fringe', eroded, 'speckle px', specks)
}
console.log('done — pristine originals in public/parts/_acc-raw/')
