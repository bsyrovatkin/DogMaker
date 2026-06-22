import { loadImage } from './recolor'
import { FURS, EARS, EYES, MUZZLES, ACCESSORIES, GROUNDS } from './catalog'
import { loadAccTune } from './accStore'

const B = import.meta.env.BASE_URL

export const baseUrl = (fur: string, ears: string) => `${B}bases/${fur}-${ears}.png`
export const partUrl = (name: string) => `${B}parts/${name}.png`

/** Preload every asset once (12 bases + eyes + muzzles + accessories + grounds). Keyed by URL. */
export async function preloadAll(): Promise<Map<string, HTMLImageElement>> {
  const urls = new Set<string>()
  for (const f of FURS) for (const e of EARS) urls.add(baseUrl(f.id, e.id))
  for (const x of EYES) urls.add(partUrl('eyes-' + x.id))
  for (const x of MUZZLES) urls.add(partUrl('muzzle-' + x.id))
  for (const x of ACCESSORIES) if (x.id) urls.add(partUrl('acc-' + x.id))
  for (const x of GROUNDS) if (x.id) urls.add(partUrl('bg-' + x.id))
  const map = new Map<string, HTMLImageElement>()
  await Promise.all([...urls].map(async (u) => { try { map.set(u, await loadImage(u)) } catch { /* skip missing */ } }))
  // overlay any manually-cropped accessories saved in the Studio (localStorage)
  const tune = loadAccTune()
  await Promise.all(Object.entries(tune).map(async ([accId, t]) => {
    if (!t.crop) return
    try { map.set(partUrl('acc-' + accId), await loadImage(t.crop)) } catch { /* bad data url */ }
  }))
  return map
}
