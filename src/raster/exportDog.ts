import { renderSticker } from './renderDog'
import type { MakerConfig } from './catalog'

export const STICKER_SIZE = 1024
/** WhatsApp static-sticker spec: exactly 512×512, WebP, transparent, ≤100 KB. */
const WHATSAPP_SIZE = 512

function safeName(cfg: MakerConfig): string {
  return (cfg.name?.trim() || 'margos-dog').replace(/[^\w-]+/g, '_').slice(0, 40) || 'margos-dog'
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

/** Save the dog to the device as a transparent PNG. */
export async function downloadPhoto(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const blob = await toBlob(renderSticker(cfg, imgs, STICKER_SIZE), 'image/png')
  if (!blob) throw new Error('toBlob returned null')
  download(blob, `${safeName(cfg)}.png`)
}

/** Share the dog as a PNG via the OS share sheet (any app or contact); fall back to download. */
export async function sharePhoto(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const blob = await toBlob(renderSticker(cfg, imgs, STICKER_SIZE), 'image/png')
  if (!blob) throw new Error('toBlob returned null')
  const file = new File([blob], `${safeName(cfg)}.png`, { type: 'image/png' })
  if (!(await tryShare(file, cfg.name || "My Margo's dog"))) download(blob, file.name)
}

/**
 * Share the dog in WhatsApp sticker format — a 512² transparent WebP (under 100 KB) — via the share
 * sheet, so the user can pick WhatsApp and send it to a chat. (Adding it to the actual sticker *tray*
 * isn't possible from a web app; that needs a native sticker-pack app.) WebP falls back to PNG where
 * the browser can't encode WebP (older Safari).
 */
export async function shareWhatsAppSticker(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const canvas = renderSticker(cfg, imgs, WHATSAPP_SIZE)
  let blob = await toBlob(canvas, 'image/webp', 0.92)
  let ext = 'webp'
  let type = 'image/webp'
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/png')
    ext = 'png'
    type = 'image/png'
  }
  if (!blob) throw new Error('toBlob returned null')
  const file = new File([blob], `${safeName(cfg)}-sticker.${ext}`, { type })
  if (!(await tryShare(file, "Margo's dog sticker"))) download(blob, file.name)
}
