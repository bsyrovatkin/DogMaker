import { renderSticker } from './renderDog'
import type { MakerConfig } from './catalog'

export const STICKER_SIZE = 1024

/** Render the finished dog to a 1024² transparent PNG and save it via Web Share, falling back to download. */
export async function saveSticker(cfg: MakerConfig, imgs: Map<string, HTMLImageElement>): Promise<void> {
  const canvas = renderSticker(cfg, imgs, STICKER_SIZE)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png')
  })
  const safe = (cfg.name?.trim() || 'margos-dog').replace(/[^\w-]+/g, '_').slice(0, 40) || 'margos-dog'
  const fname = `${safe}.png`
  const file = new File([blob], fname, { type: 'image/png' })
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean
    share?: (d: { files: File[]; title?: string }) => Promise<void>
  }
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try { await nav.share({ files: [file], title: cfg.name || "My Margo's dog" }); return }
    catch { /* cancelled — fall back to download */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fname
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
