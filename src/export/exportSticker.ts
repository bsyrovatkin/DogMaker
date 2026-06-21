import type { DogConfig } from '../types'
import { composeSvg } from '../render/composeSvg'

export const STICKER_SIZE = 1024

export function buildExportSvg(config: DogConfig): string {
  return composeSvg(config, { size: STICKER_SIZE })
}

export async function svgToPngBlob(svg: string, size = STICKER_SIZE): Promise<Blob> {
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  const img = new Image()
  img.width = size
  img.height = size
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load SVG image'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.clearRect(0, 0, size, size) // transparent background
  ctx.drawImage(img, 0, 0, size, size)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png')
  })
}

/** Render the current dog to a PNG and offer it via Web Share, falling back to download. */
export async function exportSticker(config: DogConfig): Promise<void> {
  const blob = await svgToPngBlob(buildExportSvg(config))
  const file = new File([blob], 'dog.png', { type: 'image/png' })
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'My DogMaker dog' })
      return
    } catch {
      /* user cancelled or share failed — fall back to download */
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dog.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
