// src/export/exportSticker.test.ts
import { describe, it, expect } from 'vitest'
import { buildExportSvg, STICKER_SIZE } from './exportSticker'
import { defaultConfig } from '../catalog/config'

describe('buildExportSvg', () => {
  it('builds the sticker at 1024x1024', () => {
    expect(STICKER_SIZE).toBe(1024)
    const svg = buildExportSvg(defaultConfig())
    expect(svg).toContain('width="1024"')
    expect(svg).toContain('height="1024"')
    expect(svg.startsWith('<svg')).toBe(true)
  })
})
