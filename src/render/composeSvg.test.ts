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

  it('accepts a viewBox override (e.g. to crop a thumbnail to the face)', () => {
    const svg = composeSvg(cfg, { viewBox: '46 44 108 108' })
    expect(svg).toContain('viewBox="46 44 108 108"')
    expect(svg).not.toContain('viewBox="-30 -10 260 260"')
  })

  it('draws a front accessory on top of the body and the default has none', () => {
    expect(composeSvg(cfg)).not.toContain('#d6534e') // acc-none: nothing extra
    const svg = composeSvg({ ...cfg, accessory: 'acc-beanie' })
    const body = svg.indexOf('M72 118')   // bodyClassic marker
    const beanie = svg.indexOf('M62 60')   // accBeanie dome marker
    expect(beanie).toBeGreaterThan(body)
  })

  it('draws wings behind the body (back layer)', () => {
    const svg = composeSvg({ ...cfg, accessory: 'acc-wings' })
    const wings = svg.indexOf('M70 128')  // accWings left wing marker
    const body = svg.indexOf('M72 118')   // bodyClassic marker
    expect(wings).toBeGreaterThan(-1)
    expect(wings).toBeLessThan(body)
  })
})
