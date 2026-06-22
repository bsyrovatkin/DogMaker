import { useEffect, useRef, useState } from 'react'
import { loadImage } from '../raster/recolor'
import { composeDog, type Anchor } from '../raster/composeDog'
import { EYE_ANCHOR, MUZZLE_ANCHOR } from '../raster/anchors'

const FURS = ['curly', 'shaggy', 'smooth', 'fluffy']
const EARS = ['floppy', 'pointy', 'round']
const BASES = FURS.flatMap((f) => EARS.map((e) => `${f}-${e}`))
const EYES = ['dots', 'big', 'sparkle', 'happy', 'sleepy', 'wide']
const MUZZLES = ['smile', 'tongue', 'o', 'calm']
const COLORS: [string, string][] = [
  ['classic', '#c98a5e'], ['chocolate', '#6b4a2f'], ['golden', '#e0aa55'],
  ['black', '#3a3330'], ['cream', '#ead8bd'], ['pink', '#e6a0b0'], ['grey', '#9a9a9a'],
]

const baseUrl = (n: string) => `${import.meta.env.BASE_URL}bases/${n}.png`
const partUrl = (n: string) => `${import.meta.env.BASE_URL}parts/${n}.png`

const KEY = 'dogmaker.anchors.v1'
const def = (): { eye: Anchor; muzzle: Anchor } => ({
  eye: { ...EYE_ANCHOR },
  muzzle: { ...MUZZLE_ANCHOR },
})

const imgCache = new Map<string, Promise<HTMLImageElement>>()
const img = (url: string) => {
  if (!imgCache.has(url)) imgCache.set(url, loadImage(url))
  return imgCache.get(url)!
}

function loadAll(): Record<string, { eye: Anchor; muzzle: Anchor }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function AnchorEditor() {
  const [baseName, setBaseName] = useState(BASES[0])
  const [eye, setEye] = useState('dots')
  const [muz, setMuz] = useState('smile')
  const [color, setColor] = useState('#c98a5e')
  const [all, setAll] = useState<Record<string, { eye: Anchor; muzzle: Anchor }>>(() => loadAll())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cur = all[baseName] ?? def()

  const save = (next: typeof all) => {
    localStorage.setItem(KEY, JSON.stringify(next))
    setAll(next)
  }
  const update = (group: 'eye' | 'muzzle', key: keyof Anchor, v: number) => {
    const base = all[baseName] ?? def()
    save({ ...all, [baseName]: { ...base, [group]: { ...base[group], [key]: v } } })
  }
  const copyToAll = () => {
    const a = all[baseName] ?? def()
    const next: typeof all = {}
    for (const b of BASES) next[b] = JSON.parse(JSON.stringify(a))
    save(next)
  }
  const resetBase = () => save({ ...all, [baseName]: def() })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [b, e, m] = await Promise.all([img(baseUrl(baseName)), img(partUrl('eyes-' + eye)), img(partUrl('muzzle-' + muz))])
      if (cancelled) return
      const cv = composeDog({ base: b, color, size: 380, eyes: e, eyeAnchor: cur.eye, muzzle: m, muzzleAnchor: cur.muzzle })
      const host = canvasRef.current
      if (!host) return
      host.width = cv.width
      host.height = cv.height
      const ctx = host.getContext('2d')!
      ctx.fillStyle = '#f0e9df'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.drawImage(cv, 0, 0)
    })()
    return () => { cancelled = true }
  }, [baseName, eye, muz, color, cur.eye.cx, cur.eye.cy, cur.eye.w, cur.muzzle.cx, cur.muzzle.cy, cur.muzzle.w])

  const sliderRow = (group: 'eye' | 'muzzle', key: keyof Anchor, label: string, min: number, max: number) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0', fontSize: 14 }}>
      <span style={{ width: 78 }}>{label}</span>
      <input type="range" min={min} max={max} step={0.002} value={cur[group][key]}
        onChange={(ev) => update(group, key, parseFloat(ev.target.value))} style={{ flex: 1 }} />
      <code style={{ width: 52, textAlign: 'right' }}>{cur[group][key].toFixed(3)}</code>
    </label>
  )

  const sel = (val: string, set: (v: string) => void, opts: string[]) => (
    <select value={val} onChange={(e) => set(e.target.value)} style={{ padding: 4, fontSize: 14 }}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>Anchor editor</h2>
        <canvas ref={canvasRef} style={{ width: 380, height: 380, border: '1px solid #ddd', borderRadius: 12, background: '#f0e9df' }} />
      </div>

      <div style={{ minWidth: 320, flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <label>Base&nbsp;{sel(baseName, setBaseName, BASES)}</label>
          <label>Eyes&nbsp;{sel(eye, setEye, EYES)}</label>
          <label>Muzzle&nbsp;{sel(muz, setMuz, MUZZLES)}</label>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {COLORS.map(([name, hex]) => (
            <button key={hex} onClick={() => setColor(hex)} title={name}
              style={{ width: 26, height: 26, borderRadius: '50%', background: hex, border: color === hex ? '3px solid #333' : '1px solid #aaa', cursor: 'pointer' }} />
          ))}
        </div>

        <h3 style={{ margin: '6px 0' }}>Eyes</h3>
        {sliderRow('eye', 'cx', 'left ↔ right', 0.3, 0.7)}
        {sliderRow('eye', 'cy', 'up ↕ down', 0.12, 0.5)}
        {sliderRow('eye', 'w', 'size', 0.1, 0.55)}

        <h3 style={{ margin: '14px 0 6px' }}>Nose / mouth</h3>
        {sliderRow('muzzle', 'cx', 'left ↔ right', 0.3, 0.7)}
        {sliderRow('muzzle', 'cy', 'up ↕ down', 0.28, 0.62)}
        {sliderRow('muzzle', 'w', 'size', 0.05, 0.35)}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={copyToAll} style={{ padding: '8px 12px', borderRadius: 8 }}>Copy this position → all bases</button>
          <button onClick={resetBase} style={{ padding: '8px 12px', borderRadius: 8 }}>Reset this base</button>
        </div>

        <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>
          Tune each base, then click <b>Copy → all</b> if they share the same pose. Positions auto-save in your browser.
        </p>
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13 }}>Show saved values (send these to lock them in)</summary>
          <textarea readOnly value={JSON.stringify(all, null, 0)} style={{ width: '100%', height: 90, fontSize: 11, marginTop: 6 }} />
        </details>
      </div>
    </div>
  )
}
