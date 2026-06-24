import { renderSticker } from './renderDog'
import type { MakerConfig } from './catalog'

export const STICKER_SIZE = 1024
/** WhatsApp static-sticker spec: exactly 512×512, WebP, transparent, ≤100 KB. */
const WHATSAPP_SIZE = 512

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

/**
 * Save the dog straight to the device as a transparent PNG — always a direct download (no app-picker
 * sheet, so it's clearly distinct from the Share/WhatsApp buttons). On Android it lands in Downloads /
 * the gallery. NOTE: iOS Safari can't write into the Photos library from the web at all (an Apple
 * restriction) — the download goes to Files; the only route to Photos is Share → "Save Image".
 */
export async function downloadPhoto(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const blob = await toBlob(renderSticker(cfg, imgs, STICKER_SIZE), 'image/png')
  if (!blob) throw new Error('toBlob returned null')
  await deliver(blob, `${safeName(cfg)}.png`, 'image/png', cfg.name || 'My dog', 'download')
}

/** Share the dog as a PNG via the OS share sheet (any app or contact); fall back to download. */
export async function sharePhoto(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const blob = await toBlob(renderSticker(cfg, imgs, STICKER_SIZE), 'image/png')
  if (!blob) throw new Error('toBlob returned null')
  await deliver(blob, `${safeName(cfg)}.png`, 'image/png', cfg.name || 'My dog', 'share')
}

/**
 * Share the dog as a proper WhatsApp sticker: 512², transparent, JUST THE DOG (no grass/ground — a
 * sticker has no scene), under 100 KB, in WebP (the canonical sticker format). Shared via the OS sheet
 * so the user picks WhatsApp. WebP falls back to PNG where the browser can't encode it (older Safari) —
 * still transparent / no background. (Pushing it into WhatsApp's sticker *tray* isn't possible from a
 * web app; that needs a native sticker-pack app — so it sends as a transparent sticker image to a chat.)
 */
export async function shareWhatsAppSticker(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const canvas = renderSticker({ ...cfg, ground: null }, imgs, WHATSAPP_SIZE)
  let type = 'image/webp'
  let ext = 'webp'
  let blob = await toBlob(canvas, 'image/webp', 0.92)
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/png') // browser can't encode WebP → transparent PNG
    type = 'image/png'
    ext = 'png'
  }
  if (!blob) throw new Error('toBlob returned null')
  await deliver(blob, `${safeName(cfg)}-sticker.${ext}`, type, 'Dog sticker', 'share')
}
