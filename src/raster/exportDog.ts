import { renderSticker } from './renderDog'
import type { MakerConfig } from './catalog'

export const STICKER_SIZE = 1024

function safeName(cfg: MakerConfig): string {
  return (cfg.name?.trim() || 'dog').replace(/[^\w-]+/g, '_').slice(0, 40) || 'dog'
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality))
}

function download(blob: Blob, fname: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fname
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type ShareNav = Navigator & {
  canShare?: (d: { files: File[] }) => boolean
  share?: (d: { files: File[]; title?: string; text?: string }) => Promise<void>
}

/** Open the OS share sheet with the file. Returns true if it was shared, false if unavailable/cancelled. */
async function tryShare(file: File, title: string): Promise<boolean> {
  const nav = navigator as ShareNav
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title })
      return true
    } catch {
      return false // user dismissed the sheet, or it errored
    }
  }
  return false
}

/**
 * Deliver a file to the user. `primary: 'share'` opens the share sheet first (the only reliable way to
 * save / hand off on iOS), `'download'` saves straight to disk (works on Android/desktop). Either way we
 * fall back to the other path if the first isn't available.
 */
export async function deliver(blob: Blob, fname: string, type: string, title: string, primary: 'share' | 'download'): Promise<void> {
  if (primary === 'share') {
    const file = new File([blob], fname, { type })
    if (await tryShare(file, title)) return
    download(blob, fname) // share unavailable (e.g. desktop) → download
  } else {
    download(blob, fname)
  }
}

// CRC32 for PNG chunks.
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

/**
 * Encode the canvas to a PNG by hand so that fully-transparent pixels keep WHITE rgb (255,255,255,a=0).
 * Why not just toBlob? The 2D canvas stores premultiplied alpha, so a transparent pixel's colour is
 * forced to black (0,0,0,0) — viewers that ignore the alpha channel then show a black box. Writing the
 * bytes ourselves keeps the file fully transparent (a=0, sticker-ready) AND white when flattened.
 * Needs CompressionStream (modern browsers); callers fall back to toBlob where it's missing.
 */
async function encodeWhiteTransparentPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const w = canvas.width, h = canvas.height
  const src = canvas.getContext('2d')!.getImageData(0, 0, w, h).data
  // raw scanlines: a 0 (no-filter) byte per row, then RGBA; transparent → white rgb, alpha 0
  const raw = new Uint8Array(h * (1 + w * 4))
  let o = 0
  for (let y = 0; y < h; y++) {
    raw[o++] = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src[i + 3] === 0) { raw[o++] = 255; raw[o++] = 255; raw[o++] = 255; raw[o++] = 0 }
      else { raw[o++] = src[i]; raw[o++] = src[i + 1]; raw[o++] = src[i + 2]; raw[o++] = src[i + 3] }
    }
  }
  const cs = new CompressionStream('deflate') // 'deflate' = zlib stream, which is what PNG IDAT expects
  const idat = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(cs)).arrayBuffer())
  const enc = new TextEncoder()
  const chunk = (type: string, data: Uint8Array): Uint8Array => {
    const out = new Uint8Array(12 + data.length)
    const dv = new DataView(out.buffer)
    dv.setUint32(0, data.length)
    out.set(enc.encode(type), 4)
    out.set(data, 8)
    dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
    return out
  }
  const ihdr = new Uint8Array(13)
  const idv = new DataView(ihdr.buffer)
  idv.setUint32(0, w); idv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 6 // 8-bit, RGBA
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))]
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let p = 0
  for (const part of parts) { out.set(part, p); p += part.length }
  return new Blob([out], { type: 'image/png' })
}

/**
 * Save the dog as a transparent PNG and download it. The background is genuinely transparent (alpha 0)
 * so it works as a sticker, and transparent pixels carry white rgb so it never shows up as a black box.
 */
export async function savePhoto(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const canvas = renderSticker(cfg, imgs, STICKER_SIZE)
  let blob: Blob | null
  if (typeof CompressionStream !== 'undefined') blob = await encodeWhiteTransparentPng(canvas)
  else blob = await toBlob(canvas, 'image/png') // old browser: plain transparent PNG (transparent-black)
  if (!blob) throw new Error('toBlob returned null')
  await deliver(blob, `${safeName(cfg)}.png`, 'image/png', cfg.name || 'My dog', 'download')
}
