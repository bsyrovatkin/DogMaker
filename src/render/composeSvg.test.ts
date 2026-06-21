// src/render/composeSvg.test.ts
import { describe, it, expect } from 'vitest'
import { composeSvg } from './composeSvg'
import { defaultConfig } from '../catalog/config'

describe('composeSvg', () => {
  const cfg = defaultConfig()

  it('produces a square 260 viewBox at the requested pixel size', () => {
    const svg = composeSvg(cfg, { size: 1024 })
    expect(svg).toContain('viewBox="-30 -10 260 260"')
    expect(svg).toContain('width="1024"')
    expect(svg).toContain('height="1024"')
  })

  it('includes the wobble filter and applies the coat color', () => {
    const svg = composeSvg(cfg)
    expect(svg).toContain('url(#dm-rough)')
    expect(svg).toContain('style="color:#c98a5e"')
  })

  it('stacks layers back-to-front: body before ears before mouth', () => {
    const svg = composeSvg(cfg)
    const body = svg.indexOf('M72 118')       // bodyClassic marker
    const ears = svg.indexOf('rotate(-8 66 120)') // earsFloppy marker
    const mouth = svg.indexOf('C96 114')       // mouthSmile marker
    expect(body).toBeGreaterThan(-1)
    expect(body).toBeLessThan(ears)
    expect(ears).toBeLessThan(mouth)
  })

  it('applies the size scale transform', () => {
    const svg = composeSvg({ ...cfg, size: 'size-giant' })
    expect(svg).toContain('scale(1.28)')
  })
})
