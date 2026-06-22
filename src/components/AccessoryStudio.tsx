import { useEffect, useRef, useState } from 'react'
import { preloadAll, partUrl } from '../raster/assets'
import { composeFromConfig, HEADROOM } from '../raster/renderDog'
import { ACCESSORY, accessoryFor } from '../raster/anchors'
import { FURS, EARS, ACCESSORIES, type MakerConfig } from '../raster/catalog'
import { loadImage } from '../raster/recolor'
import { loadAccTune, updateAccTune, type AccAnchor } from '../raster/accStore'

type Imgs = Map<string, HTMLImageElement>

const W = 440
const TOPPAD = Math.round(HEADROOM * W) // headroom above the dog (matches composeDog)
const BASEH = W // bases are square
const H = W + TOPPAD
const ACC_IDS = ACCESSORIES.filter((a) => a.id).map((a) => a.id as string)

function alphaBox(cnv: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  const { width: w, height: h } = cnv
  const d = cnv.getContext('2d')!.getImageData(0, 0, w, h).data
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false
  for (let p = 0; p < w * h; p++) {
    if (d[p * 4 + 3] > 12) { found = true; const x = p % w, y = (p / w) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
  }
  return found ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null
}

export function AccessoryStudio() {
  const [imgs, setImgs] = useState<Imgs | null>(null)
  const [base, setBase] = useState('curly-floppy')
  const [accId, setAccId] = useState('beanie')
  const [anchor, setAnchor] = useState<AccAnchor>(ACCESSORY.beanie.anchor)
  const [accImg, setAccImg] = useState<HTMLCanvasElement | null>(null)
  const [dogCanvas, setDogCanvas] = useState<HTMLCanvasElement | null>(null)
  const [tick, setTick] = useState(0) // bump to redraw after an in-place erase
  const [mode, setMode] = useState<'move' | 'erase'>('move')
  const [brush, setBrush] = useState(26)
  const [perBase, setPerBase] = useState(false)
  const [status, setStatus] = useState('Tuning auto-saves to this browser. Use Export before deploy.')

  const mainRef = useRef<HTMLCanvasElement>(null)
  const anchorRef = useRef(anchor)
  const drag = useRef<{ mx: number; my: number; a: AccAnchor } | null>(null)
  const painting = useRef(false)
  const setA = (a: AccAnchor) => { anchorRef.current = a; setAnchor(a) }

  useEffect(() => { let live = true; preloadAll().then((m) => { if (live) setImgs(m) }); return () => { live = false } }, [])

  // recompute the (neutral) dog when base or assets change
  useEffect(() => {
    if (!imgs) return
    const [fur, ears] = base.split('-')
    const cfg: MakerConfig = { fur, ears, color: '#c98a5e', spot: null, eyes: 'dots', muzzle: 'smile', size: 1, accessories: [], ground: null, name: '' }
    setDogCanvas(composeFromConfig(cfg, imgs, W))
  }, [base, imgs])

  // load the accessory image (localStorage crop wins) when the accessory changes
  useEffect(() => {
    let live = true
    setAccImg(null)
    void (async () => {
      const t = loadAccTune()[accId]
      const src = t?.crop || partUrl('acc-' + accId) + '?t=' + Date.now()
      try {
        const img = await loadImage(src)
        if (!live) return
        const c = document.createElement('canvas')
        c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext('2d')!.drawImage(img, 0, 0)
        setAccImg(c)
      } catch { /* missing */ }
    })()
    return () => { live = false }
  }, [accId])

  // load the saved anchor when the accessory or dog changes
  useEffect(() => { setA(accessoryFor(accId, base)!.anchor) /* eslint-disable-next-line */ }, [accId, base])

  // single source of truth for drawing — always uses the CURRENT state, so no switch races
  useEffect(() => {
    const cnv = mainRef.current
    if (!cnv) return
    const ctx = cnv.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    const back = !!ACCESSORY[accId].back
    const drawAcc = () => {
      if (!accImg) return
      const box = alphaBox(accImg); if (!box) return
      const scale = (anchor.w * W) / box.w
      const dw = box.w * scale, dh = box.h * scale
      ctx.drawImage(accImg, box.x, box.y, box.w, box.h, anchor.cx * W - dw / 2, TOPPAD + anchor.cy * BASEH - dh / 2, dw, dh)
    }
    if (back) drawAcc()
    if (dogCanvas) ctx.drawImage(dogCanvas, 0, 0)
    if (!back) drawAcc()
  }, [accImg, dogCanvas, anchor, accId, tick])

  const persistAnchor = (a: AccAnchor) => {
    updateAccTune(accId, (t) => {
      const next = { ...t }
      if (perBase) next.byBase = { ...(t.byBase || {}), [base]: a }
      else next.anchor = a
      return next
    })
    setStatus(perBase ? '✓ position saved for ' + base : '✓ position saved (all dogs)')
  }
  const applyAnchor = (a: AccAnchor) => { setA(a); persistAnchor(a) }

  const toLocal = (e: React.PointerEvent) => {
    const r = mainRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }

  const eraseAt = (mx: number, my: number) => {
    if (!accImg) return
    const box = alphaBox(accImg); if (!box) return
    const scale = (anchor.w * W) / box.w
    const dw = box.w * scale, dh = box.h * scale
    const dx = anchor.cx * W - dw / 2, dy = TOPPAD + anchor.cy * BASEH - dh / 2
    const sx = box.x + ((mx - dx) / dw) * box.w
    const sy = box.y + ((my - dy) / dh) * box.h
    const r = brush * (box.w / dw)
    const a = accImg.getContext('2d')!
    a.save(); a.globalCompositeOperation = 'destination-out'; a.beginPath(); a.arc(sx, sy, r, 0, Math.PI * 2); a.fill(); a.restore()
    setTick((t) => t + 1)
  }

  const persistCrop = () => {
    if (!accImg) return
    updateAccTune(accId, (t) => ({ ...t, crop: accImg.toDataURL('image/png'), cropTop: 0 }))
    setStatus('✓ crop saved')
  }

  const onDown = (e: React.PointerEvent) => {
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch { /* synthetic */ }
    const p = toLocal(e)
    if (mode === 'erase') { painting.current = true; eraseAt(p.x, p.y) }
    else drag.current = { mx: p.x, my: p.y, a: anchorRef.current }
  }
  const onMove = (e: React.PointerEvent) => {
    if (mode === 'erase') { if (painting.current) { const p = toLocal(e); eraseAt(p.x, p.y) } return }
    if (!drag.current) return
    const p = toLocal(e)
    setA({ ...drag.current.a, cx: drag.current.a.cx + (p.x - drag.current.mx) / W, cy: drag.current.a.cy + (p.y - drag.current.my) / BASEH })
  }
  const onUp = () => {
    if (painting.current) { painting.current = false; persistCrop() }
    if (drag.current) { drag.current = null; persistAnchor(anchorRef.current) }
  }
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); applyAnchor({ ...anchorRef.current, w: Math.max(0.05, Math.min(1.6, anchorRef.current.w * (e.deltaY < 0 ? 1.06 : 0.94))) }) }

  function resetPosition() {
    updateAccTune(accId, (t) => { const n = { ...t }; delete n.anchor; if (n.byBase) delete n.byBase[base]; return n })
    setA(ACCESSORY[accId].anchor)
    setStatus('↺ position reset to default')
  }
  function resetCrop() {
    updateAccTune(accId, (t) => { const n = { ...t }; delete n.crop; delete n.cropTop; return n })
    // force a fresh load of the original file
    setAccImg(null)
    void (async () => {
      try {
        const img = await loadImage(partUrl('acc-' + accId) + '?t=' + Date.now())
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext('2d')!.drawImage(img, 0, 0); setAccImg(c)
      } catch { /* missing */ }
    })()
    setStatus('↺ crop reset to original')
  }
  async function exportAll() {
    setStatus('Exporting to project…')
    const all = loadAccTune()
    const anchorsJson: Record<string, { anchor?: AccAnchor; byBase?: Record<string, AccAnchor>; cropTop?: number }> = {}
    for (const [id, t] of Object.entries(all)) {
      const e: { anchor?: AccAnchor; byBase?: Record<string, AccAnchor>; cropTop?: number } = {}
      if (t.anchor) e.anchor = t.anchor
      if (t.byBase && Object.keys(t.byBase).length) e.byBase = t.byBase
      if (t.cropTop != null) e.cropTop = t.cropTop
      if (Object.keys(e).length) anchorsJson[id] = e
    }
    try {
      await fetch('/api/save-anchors', { method: 'POST', body: JSON.stringify(anchorsJson, null, 2) })
      let crops = 0
      for (const [id, t] of Object.entries(all)) {
        if (t.crop) { await fetch('/api/save-part', { method: 'POST', body: JSON.stringify({ name: 'acc-' + id, dataUrl: t.crop }) }); crops++ }
      }
      setStatus(`✓ Exported to project — anchors + ${crops} crop(s). Ready to commit.`)
    } catch (e) { setStatus('Export failed: ' + e) }
  }

  if (!imgs) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Loading…</div>

  const lbl: React.CSSProperties = { fontSize: 13, color: '#555' }
  const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14 }
  return (
    <div style={{ display: 'flex', gap: 20, padding: 20, fontFamily: 'system-ui, sans-serif', flexWrap: 'wrap' }}>
      <div>
        <canvas
          ref={mainRef} width={W} height={H}
          style={{ width: W, height: H, border: '1px solid #e7ddcd', borderRadius: 16, background: 'repeating-conic-gradient(#f3eee5 0% 25%, #fff 0% 50%) 50% / 22px 22px', touchAction: 'none', cursor: mode === 'erase' ? 'crosshair' : 'move' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel}
        />
        <p style={{ ...lbl, marginTop: 6 }}>{mode === 'move' ? 'Drag to position · wheel to scale (auto-saved)' : 'Paint to erase the part you don’t want (auto-saved on release)'}</p>
      </div>

      <div style={{ minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: '0 0 4px' }}>Accessory Studio</h2>

        <label style={lbl}>Dog<br />
          <select value={base} onChange={(e) => setBase(e.target.value)} style={{ width: '100%', padding: 6 }}>
            {FURS.flatMap((f) => EARS.map((e) => `${f.id}-${e.id}`)).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <label style={lbl}>Accessory<br />
          <select value={accId} onChange={(e) => setAccId(e.target.value)} style={{ width: '100%', padding: 6 }}>
            {ACC_IDS.map((a) => <option key={a} value={a}>{a}{ACCESSORY[a].back ? ' (behind)' : ''}</option>)}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btn, fontWeight: mode === 'move' ? 700 : 400, background: mode === 'move' ? '#fff3e2' : '#fff' }} onClick={() => setMode('move')}>✋ Move</button>
          <button style={{ ...btn, fontWeight: mode === 'erase' ? 700 : 400, background: mode === 'erase' ? '#fff3e2' : '#fff' }} onClick={() => setMode('erase')}>🩹 Erase</button>
        </div>

        <label style={lbl}>Scale {anchor.w.toFixed(3)}<br />
          <input type="range" min={0.05} max={1.6} step={0.005} value={anchor.w} onChange={(e) => applyAnchor({ ...anchor, w: +e.target.value })} style={{ width: '100%' }} />
        </label>
        <label style={lbl}>Brush {brush}px<br />
          <input type="range" min={4} max={80} step={1} value={brush} onChange={(e) => setBrush(+e.target.value)} style={{ width: '100%' }} />
        </label>

        <label style={{ ...lbl, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={perBase} onChange={(e) => setPerBase(e.target.checked)} /> position is for THIS dog only
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={btn} onClick={resetPosition}>↺ Reset position</button>
          <button style={btn} onClick={resetCrop}>↺ Reset crop</button>
        </div>
        <button style={{ ...btn, background: '#e8943b', color: '#fff', border: 'none', fontWeight: 700 }} onClick={exportAll}>⬇ Export to project (before deploy)</button>

        <p style={{ ...lbl, minHeight: 18, color: '#1a7f37' }}>{status}</p>
        <p style={lbl}>cx {anchor.cx.toFixed(3)} · cy {anchor.cy.toFixed(3)} · w {anchor.w.toFixed(3)}</p>
      </div>
    </div>
  )
}
