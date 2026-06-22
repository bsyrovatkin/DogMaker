// Reliable client-side store for accessory tuning (position + manual crop).
// Lives in localStorage so it persists across reloads instantly — no server round-trip, no HMR
// reloads, nothing to lose. The committed accessoryAnchors.json is the deploy-time fallback;
// an explicit "Export" in the Studio writes this store to the repo for committing.

export interface AccAnchor { cx: number; cy: number; w: number }
export interface AccTune {
  anchor?: AccAnchor
  byBase?: Record<string, AccAnchor>
  cropTop?: number
  /** PNG data URL of the manually-cropped accessory (overrides the file). */
  crop?: string
}
export type AccTuneMap = Record<string, AccTune>

const KEY = 'dogmaker.acc.v1'

export function loadAccTune(): AccTuneMap {
  if (typeof localStorage === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveAccTune(all: AccTuneMap): void {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* quota — ignore */ }
}

export function updateAccTune(accId: string, patch: (t: AccTune) => AccTune): AccTuneMap {
  const all = loadAccTune()
  all[accId] = patch(all[accId] || {})
  saveAccTune(all)
  return all
}
