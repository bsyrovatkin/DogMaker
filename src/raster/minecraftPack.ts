// Build a Minecraft Bedrock resource pack (.mcpack) that turns EVERY painting into the dog.
// It replaces textures/painting/kz.png — the painting atlas — drawing the dog into every
// painting region, so any painting the kid places shows their puppy. Tablet-friendly: tapping
// the downloaded .mcpack imports it into Minecraft (Bedrock / Pocket Edition).
import { renderSticker } from './renderDog'
import { deliver } from './exportDog'
import { isIOS } from './platform'
import type { MakerConfig } from './catalog'

// ---- minimal store-only ZIP (no deps; PNGs are already compressed) ----
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function zipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const lh = new DataView(new ArrayBuffer(30))
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0, true); lh.setUint16(8, 0, true)
    lh.setUint16(10, 0, true); lh.setUint16(12, 0, true); lh.setUint32(14, crc, true)
    lh.setUint32(18, f.data.length, true); lh.setUint32(22, f.data.length, true)
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true)
    locals.push(new Uint8Array(lh.buffer), name, f.data)
    const ch = new DataView(new ArrayBuffer(46))
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0, true)
    ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0, true); ch.setUint32(16, crc, true)
    ch.setUint32(20, f.data.length, true); ch.setUint32(24, f.data.length, true)
    ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true)
    ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true)
    centrals.push(new Uint8Array(ch.buffer), name)
    offset += 30 + name.length + f.data.length
  }
  const cdSize = centrals.reduce((s, a) => s + a.length, 0)
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(8, files.length, true); eocd.setUint16(10, files.length, true)
  eocd.setUint32(12, cdSize, true); eocd.setUint32(16, offset, true); eocd.setUint16(20, 0, true)
  const parts = [...locals, ...centrals, new Uint8Array(eocd.buffer)]
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return new Blob([out], { type: 'application/zip' })
}

const canvasToBytes = (c: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((res, rej) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => res(new Uint8Array(a))) : rej(new Error('toBlob'))), 'image/png'))

// painting regions in the 256×256 Bedrock atlas (x, y, w, h in pixels)
const PAINTINGS: [number, number, number, number][] = [
  [0, 0, 16, 16], [16, 0, 16, 16], [32, 0, 16, 16], [48, 0, 16, 16], [64, 0, 16, 16], [80, 0, 16, 16], [96, 0, 16, 16],
  [0, 32, 32, 16], [32, 32, 32, 16], [64, 32, 32, 16], [96, 32, 32, 16], [128, 32, 32, 16],
  [0, 64, 16, 32], [16, 64, 16, 32],
  [0, 96, 64, 32],
  [0, 128, 32, 32], [32, 128, 32, 32], [64, 128, 32, 32], [96, 128, 32, 32], [128, 128, 32, 32], [160, 128, 32, 32],
  [0, 192, 64, 64], [64, 192, 64, 64], [128, 192, 64, 64],
  [192, 64, 64, 48], [192, 112, 64, 48],
]

/** Draw the dog (contained, centred, on a paper background) into every painting region. */
function buildAtlas(dog: HTMLCanvasElement): HTMLCanvasElement {
  const atlas = document.createElement('canvas')
  atlas.width = 256; atlas.height = 256
  const ctx = atlas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  for (const [x, y, w, h] of PAINTINGS) {
    ctx.fillStyle = '#f3ead8'; ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#caa86f'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h)
    const pad = Math.max(1, Math.round(Math.min(w, h) * 0.06))
    const bw = w - pad * 2, bh = h - pad * 2
    const s = Math.min(bw / dog.width, bh / dog.height)
    const dw = dog.width * s, dh = dog.height * s
    ctx.drawImage(dog, x + pad + (bw - dw) / 2, y + pad + (bh - dh) / 2, dw, dh)
  }
  return atlas
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`
}

/** Build and download a .mcpack that makes every Minecraft painting show this dog. */
export async function exportMcpack(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const dog = renderSticker(cfg, imgs, 512)
  const atlas = buildAtlas(dog)
  const icon = renderSticker(cfg, imgs, 128)
  const name = (cfg.name?.trim() || 'My dog')
  const manifest = {
    format_version: 2,
    header: { name: `${name} painting`, description: 'Every painting is your puppy! Made with Dog Maker.', uuid: uuid(), version: [1, 0, 0], min_engine_version: [1, 16, 0] },
    modules: [{ type: 'resources', uuid: uuid(), version: [1, 0, 0] }],
  }
  const enc = new TextEncoder()
  const files = [
    { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) },
    { name: 'pack_icon.png', data: await canvasToBytes(icon) },
    { name: 'textures/painting/kz.png', data: await canvasToBytes(atlas) },
  ]
  const blob = zipStore(files)
  const safe = (cfg.name?.trim() || 'dog').replace(/[^\w-]+/g, '_').slice(0, 40) || 'dog'
  // iOS (esp. installed PWA) can't download to a folder the user can reach, but the share sheet offers
  // "Copy to Minecraft"; Android downloads the .mcpack so the user taps it to import.
  await deliver(blob, `${safe}.mcpack`, 'application/octet-stream', `${name} painting`, isIOS ? 'share' : 'download')
}
