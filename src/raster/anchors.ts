import type { Anchor } from './composeDog'
import accessoryOverrides from './accessoryAnchors.json'
import { loadAccTune } from './accStore'

/**
 * Where the face parts sit on the blank-face bases, as fractions of the base canvas.
 * Tuned in the #editor and locked here. All 12 bases currently share the same pose,
 * so one set works for every base; add per-base overrides to FACE_OVERRIDES if needed.
 */
export const EYE_ANCHOR: Anchor = { cx: 0.5, cy: 0.272, w: 0.208 }
export const MUZZLE_ANCHOR: Anchor = { cx: 0.5, cy: 0.384, w: 0.092 }

/** Optional per-base overrides, keyed by `${fur}-${ears}`. */
export const FACE_OVERRIDES: Record<string, { eye?: Anchor; muzzle?: Anchor }> = {}

export function eyeAnchorFor(base: string): Anchor {
  return FACE_OVERRIDES[base]?.eye ?? EYE_ANCHOR
}
export function muzzleAnchorFor(base: string): Anchor {
  return FACE_OVERRIDES[base]?.muzzle ?? MUZZLE_ANCHOR
}

/** Ground / background sits low and wide, behind the dog. */
export const GROUND_ANCHOR: Anchor = { cx: 0.5, cy: 0.86, w: 0.98 }

/**
 * Rough default placement per accessory — tune in the editor.
 * `back: true` renders behind the dog. `cropTop` cuts that fraction off the top
 * (hides the wrap-around back arc of neck items so the front lies flat on the chest).
 */
export const ACCESSORY: Record<string, { anchor: Anchor; back?: boolean; cropTop?: number }> = {
  beanie: { anchor: { cx: 0.5, cy: 0.08, w: 0.37 } },
  partyhat: { anchor: { cx: 0.5, cy: 0.06, w: 0.26 } },
  crown: { anchor: { cx: 0.5, cy: 0.1, w: 0.4 } },
  bow: { anchor: { cx: 0.31, cy: 0.22, w: 0.22 } },
  glasses: { anchor: { cx: 0.5, cy: 0.28, w: 0.4 } },
  bandana: { anchor: { cx: 0.5, cy: 0.5, w: 0.5 } },
  collar: { anchor: { cx: 0.5, cy: 0.52, w: 0.46 }, cropTop: 0.42 },
  scarf: { anchor: { cx: 0.5, cy: 0.52, w: 0.52 }, cropTop: 0.34 },
  tie: { anchor: { cx: 0.5, cy: 0.52, w: 0.15 } },
  wings: { anchor: { cx: 0.5, cy: 0.5, w: 0.98 }, back: true },
  spacewhite: { anchor: { cx: 0.5, cy: 0.27, w: 0.64 } },
  spaceblue: { anchor: { cx: 0.5, cy: 0.27, w: 0.64 } },
  hardhat: { anchor: { cx: 0.5, cy: 0.15, w: 0.5 } },
  melon: { anchor: { cx: 0.5, cy: 0.16, w: 0.54 } },
}

/** Per-accessory tuning saved by the Accessory Studio: a shared anchor + optional per-base override + cropTop. */
interface AccOverride { anchor?: Anchor; cropTop?: number; byBase?: Record<string, Anchor> }
const OVERRIDES = accessoryOverrides as Record<string, AccOverride>

/** Resolve an accessory's placement for a given base. Live localStorage tuning wins, then the
 * committed accessoryAnchors.json, then the built-in default. */
export function accessoryFor(acc: string, base: string): { anchor: Anchor; back?: boolean; cropTop?: number } | undefined {
  const def = ACCESSORY[acc]
  if (!def) return undefined
  const local = loadAccTune()[acc]
  const json = OVERRIDES[acc]
  return {
    anchor: local?.byBase?.[base] ?? local?.anchor ?? json?.byBase?.[base] ?? json?.anchor ?? def.anchor,
    back: def.back,
    cropTop: local?.cropTop ?? json?.cropTop ?? def.cropTop,
  }
}
