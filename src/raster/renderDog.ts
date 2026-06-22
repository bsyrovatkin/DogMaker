import { composeDog } from './composeDog'
import { eyeAnchorFor, muzzleAnchorFor, GROUND_ANCHOR, accessoryFor } from './anchors'
import { baseUrl, partUrl } from './assets'
import { MUZZLES, type MakerConfig } from './catalog'
import type { SpotPattern } from './recolor'

type Imgs = Map<string, HTMLImageElement>

/** Transparent space added above the dog (fraction of width) so tall hats (party hat) have room. */
export const HEADROOM = 0.2

/** Compose the dog described by `cfg` at the given pixel size. Returns null if the base isn't loaded. */
export function composeFromConfig(cfg: MakerConfig, imgs: Imgs, size: number): HTMLCanvasElement | null {
  const base = imgs.get(baseUrl(cfg.fur, cfg.ears))
  if (!base) return null
  const baseKey = `${cfg.fur}-${cfg.ears}`
  const eyes = imgs.get(partUrl('eyes-' + cfg.eyes))
  const muzzle = imgs.get(partUrl('muzzle-' + cfg.muzzle))
  const ground = cfg.ground ? imgs.get(partUrl('bg-' + cfg.ground)) : undefined
  const accessories = (cfg.accessories ?? []).flatMap((id) => {
    const img = imgs.get(partUrl('acc-' + id))
    const def = accessoryFor(id, baseKey)
    return img && def ? [{ img, anchor: def.anchor, back: def.back, cropTop: def.cropTop }] : []
  })
  const muzzleDef = MUZZLES.find((m) => m.id === cfg.muzzle)

  return composeDog({
    base,
    color: cfg.color,
    size,
    headroom: HEADROOM,
    spotColor: cfg.spotPattern ? cfg.spotColor : undefined,
    spotPattern: (cfg.spotPattern as SpotPattern | null) ?? undefined,
    spotSeed: 7,
    eyes: eyes ?? undefined,
    eyeAnchor: eyes ? eyeAnchorFor(baseKey) : undefined,
    muzzle: muzzle ?? undefined,
    muzzleAnchor: muzzle ? muzzleAnchorFor(baseKey) : undefined,
    muzzlePink: muzzleDef?.pink,
    muzzleColored: muzzleDef?.colored,
    ground: ground ?? undefined,
    groundAnchor: ground ? GROUND_ANCHOR : undefined,
    accessories,
  })
}

/** Draw the dog onto an existing canvas (sized px×px): fit the tall compose by height, bottom-aligned. */
export function drawDogTo(canvas: HTMLCanvasElement, cfg: MakerConfig, imgs: Imgs, px: number): void {
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, px, px)
  const inner = composeFromConfig(cfg, imgs, px)
  if (inner) {
    // size 1 fills ~94% of the height; "Big" is capped at a full-height fit so it never clips
    const scale = (px / inner.height) * Math.min(cfg.size * 0.94, 1)
    const body = cfg.body ?? 1 // horizontal stretch: whole composite (dog + accessories) widens/narrows together
    const dw = inner.width * scale * body
    const dh = inner.height * scale
    ctx.drawImage(inner, (px - dw) / 2, px - dh, dw, dh) // bottom-aligned: grass sits at the floor
  }
}

/** Render the dog onto a fresh square `px`×`px` canvas. */
export function renderSticker(cfg: MakerConfig, imgs: Imgs, px: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  drawDogTo(c, cfg, imgs, px)
  return c
}
