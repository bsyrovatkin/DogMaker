import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { preloadAll } from '../raster/assets'
import { drawDogTo } from '../raster/renderDog'
import { downloadPhoto, sharePhoto, shareWhatsAppSticker } from '../raster/exportDog'
import { exportMcpack } from '../raster/minecraftPack'
import { isIOS } from '../raster/platform'
import {
  FURS, EARS, COLORS, SPOT_PATTERNS, SPOT_COLORS, EYES, MUZZLES, SIZES, BODIES, ACCESSORIES, GROUNDS,
  DEFAULT_CONFIG, randomConfig, type MakerConfig,
} from '../raster/catalog'
import './maker.css'

type Imgs = Map<string, HTMLImageElement>
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> }

/** Draw the dog into a canvas sized to its actual on-screen pixels (× dpr), so it's never blurry. */
function DogView({ cfg, imgs, px }: { cfg: MakerConfig; imgs: Imgs; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [w, setW] = useState(px ?? 200)
  useEffect(() => {
    const c = ref.current
    if (!c || px != null) return // fixed-size path: skip the observer
    const measure = () => { const r = c.getBoundingClientRect(); if (r.width > 0) setW(Math.round(r.width)) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(c)
    return () => ro.disconnect()
  }, [px])
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const target = px ?? w
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    drawDogTo(c, cfg, imgs, Math.max(64, Math.round(target * dpr)))
  }, [cfg.fur, cfg.ears, cfg.color, cfg.spotPattern, cfg.spotColor, cfg.eyes, cfg.muzzle, cfg.size, cfg.body, cfg.accessories.join(','), cfg.ground, imgs, px, w])
  return <canvas ref={ref} className="dogview" />
}

function Tile(props: { label: string; selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={'tile' + (props.selected ? ' on' : '')} onClick={props.onClick}>
      <span className="tile-art">{props.children}</span>
      <span className="tile-label">{props.label}</span>
    </button>
  )
}

/** Fixed notebook background: cream paper, faint grid, four square notebook photos peeking in from the corners. */
function PaperBg() {
  const B = import.meta.env.BASE_URL
  const corners: ('tl' | 'tr' | 'bl' | 'br')[] = ['tl', 'tr', 'bl', 'br']
  return (
    <div className="paper-bg" aria-hidden="true">
      {corners.map((c, i) => (
        <div key={c} className={`corner ${c}`}><img src={`${B}notebook/bg-${i + 1}.jpg`} alt="" /></div>
      ))}
    </div>
  )
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function StartScreen({ imgs, sample, onStart, canInstall, onInstall }: { imgs: Imgs; sample: MakerConfig; onStart: () => void; canInstall: boolean; onInstall: () => void }) {
  const [howTo, setHowTo] = useState<null | 'ios' | 'desktop'>(null)
  const installed = isStandalone()
  const ios = isIOS
  const showInstall = !installed
  function handleInstall() {
    if (canInstall) { onInstall(); return }
    setHowTo(ios ? 'ios' : 'desktop')
  }
  return (
    <div className="start">
      <h1 className="brand">Dog Maker</h1>
      <p className="tag">make your very own puppy — and keep it as a sticker</p>
      <div className="start-card"><DogView cfg={sample} imgs={imgs} px={300} /></div>
      <button type="button" className="cta start-cta" onClick={onStart}>Start ▶</button>
      {showInstall && <button type="button" className="ghost install-btn" onClick={handleInstall}>📲 Add to Home Screen</button>}
      <p className="start-note">built from a kid’s real drawings ✏️</p>
      {howTo && <InstallHelp kind={howTo} onClose={() => setHowTo(null)} />}
    </div>
  )
}

function InstallHelp({ kind, onClose }: { kind: 'ios' | 'desktop'; onClose: () => void }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close">×</button>
        <h3 className="modal-title">Add to Home Screen</h3>
        {kind === 'ios' ? (
          <ol className="howto">
            <li>Open this page in <b>Safari</b> (if you’re in another browser, copy the link and paste it in Safari).</li>
            <li>Tap the <b>Share</b> button <span className="key">⬆️</span> at the bottom of the screen.</li>
            <li>Scroll and tap <b>«Add to Home Screen»</b> <span className="key">＋</span>.</li>
            <li>Tap <b>Add</b>. The Dog Maker icon will appear on your home screen.</li>
          </ol>
        ) : (
          <ol className="howto">
            <li>In Chrome or Edge, click the <b>install</b> icon <span className="key">⊕</span> in the address bar.</li>
            <li>Or open the menu <span className="key">⋮</span> and pick <b>«Install Dog Maker»</b>.</li>
          </ol>
        )}
        <button type="button" className="cta" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

function McHelp({ onClose, onDownload }: { onClose: () => void; onDownload: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'making' | 'done'>('idle')
  async function download() {
    setState('making')
    try { await onDownload(); setState('done') }
    catch { setState('idle'); alert("Sorry — couldn't make the Minecraft pack. Please try again.") }
  }
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal mc-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close">×</button>
        <h3 className="modal-title">⛏️ Put your dog in Minecraft</h3>
        <p className="hint" style={{ textAlign: 'left', maxWidth: 'none', marginTop: 0 }}>
          For <b>Minecraft on a tablet or phone</b> (the “Bedrock” version). Do the steps in order — it’s easy! 💪
        </p>

        <p className="substep" style={{ marginTop: 14 }}>① Get the pack</p>
        <ol className="howto" start={1}>
          <li>Tap the big button below. It makes a file named <b>…​.mcpack</b>.</li>
          {isIOS ? (
            <li>In the <b>share sheet</b> tap <b>“Copy to Minecraft”</b> (or <b>“Save to Files”</b>, then open the file from the <b>Files</b> app). Minecraft opens and shows <b>“Importing…”</b>, then <b>“Successfully imported”</b>. 🎉</li>
          ) : (
            <li><b>Open that file</b> — tap it in the download pop-up (or in your <b>Files / Downloads</b> app). Minecraft opens by itself and shows <b>“Importing…”</b>, then <b>“Successfully imported”</b>. 🎉</li>
          )}
        </ol>

        <p className="substep">② Turn it on in a world</p>
        <ol className="howto" start={3}>
          <li>In Minecraft tap <b>Play → Create New → Create New World</b> (or pick a world you already have and tap the <b>pencil ✏️</b>).</li>
          <li>On the left choose <b>Resource Packs → My Packs</b>, tap <b>“… painting”</b>, then tap <b>Activate</b>.</li>
          <li>Tip for little hands: under <b>Game</b>, set <b>Game Mode = Creative</b> — then blocks and paintings are free. Tap <b>Create / Play</b>.</li>
        </ol>

        <p className="substep">③ Hang the painting 🐶</p>
        <ol className="howto" start={6}>
          <li>Tap the <b>“…” / ⊞ inventory</b> button, type <b>painting</b> in search, and tap the painting to grab it.</li>
          <li>Stand in front of a <b>flat wall</b> (no wall? stack a few blocks to make one).</li>
          <li><b>Tap the wall</b> — your puppy appears as a painting! Tap again for more. 🐾</li>
        </ol>

        <p className="hint" style={{ textAlign: 'left', maxWidth: 'none' }}>
          ✨ <b>Every</b> painting in that world is now your dog — any wall works. If one looks cut off, hold/break it and place it on a <b>bigger</b> wall (try 2×2 or 4×3) to get a larger picture.
        </p>

        <button type="button" className="cta mc-btn" onClick={download} disabled={state === 'making'}>
          {state === 'making' ? 'Making the pack…' : state === 'done' ? (isIOS ? '✓ Sent — now open it in Minecraft' : '✓ Downloaded — now open the file') : (isIOS ? '📤 Get the pack' : '⬇️ Download the pack')}
        </button>
        {state === 'done' && <p className="start-note" style={{ marginTop: 8 }}>{isIOS ? 'In the share sheet pick “Copy to Minecraft”, or “Save to Files” and tap it there.' : 'Saved! Find it in your Downloads and tap it to open Minecraft.'}</p>}
      </div>
    </div>
  )
}

const STEPS: { key: string; q: string }[] = [
  { key: 'fur', q: 'What kind of fur?' },
  { key: 'ears', q: 'Pick the ears' },
  { key: 'color', q: 'Choose a colour' },
  { key: 'spot', q: 'Spots — pattern and colour' },
  { key: 'eyes', q: 'Pick the eyes' },
  { key: 'muzzle', q: 'Pick the mouth' },
  { key: 'size', q: 'How big?' },
  { key: 'body', q: 'Thin or chonky?' },
  { key: 'accessory', q: 'Add accessories — pick as many as you like' },
  { key: 'ground', q: 'Where does it sit?' },
]

export function Maker() {
  const [imgs, setImgs] = useState<Imgs | null>(null)
  const [cfg, setCfg] = useState<MakerConfig>(DEFAULT_CONFIG)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [started, setStarted] = useState(false)
  const [sample] = useState<MakerConfig>(() => ({ ...randomConfig(), accessories: ['partyhat'], ground: 'grass' }))
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null)
  const [showMc, setShowMc] = useState(false)

  useEffect(() => { let live = true; preloadAll().then((m) => { if (live) setImgs(m) }); return () => { live = false } }, [])

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  async function install() {
    if (!installEvt) return
    await installEvt.prompt()
    await installEvt.userChoice
    setInstallEvt(null)
  }

  const set = (patch: Partial<MakerConfig>) => setCfg((c) => ({ ...c, ...patch }))
  const variant = (patch: Partial<MakerConfig>): MakerConfig => ({ ...cfg, ...patch })

  const last = step === STEPS.length - 1
  const cur = STEPS[step]

  // run an async export action with a shared "busy" guard so the chunky buttons can't double-fire
  async function run(fn: (cfg: MakerConfig, imgs: Imgs) => Promise<void>) {
    if (!imgs || saving) return
    setSaving(true)
    try { await fn(cfg, imgs) }
    catch { alert("Sorry — that didn't work. Please try again.") }
    finally { setSaving(false) }
  }

  async function downloadMcpack() {
    if (!imgs) return
    await exportMcpack(cfg, imgs)
  }

  const tiles = useMemo(() => {
    if (!imgs) return null
    const thumb = (v: Partial<MakerConfig>) => <DogView cfg={variant(v)} imgs={imgs} />
    switch (cur.key) {
      case 'fur':
        return FURS.map((o) => <Tile key={o.id} label={o.label} selected={cfg.fur === o.id} onClick={() => set({ fur: o.id })}>{thumb({ fur: o.id })}</Tile>)
      case 'ears':
        return EARS.map((o) => <Tile key={o.id} label={o.label} selected={cfg.ears === o.id} onClick={() => set({ ears: o.id })}>{thumb({ ears: o.id })}</Tile>)
      case 'color':
        return COLORS.map((o) => <Tile key={o.hex} label={o.label} selected={cfg.color === o.hex} onClick={() => set({ color: o.hex })}>{thumb({ color: o.hex })}</Tile>)
      case 'eyes':
        return EYES.map((o) => <Tile key={o.id} label={o.label} selected={cfg.eyes === o.id} onClick={() => set({ eyes: o.id })}>{thumb({ eyes: o.id })}</Tile>)
      case 'muzzle':
        return MUZZLES.map((o) => <Tile key={o.id} label={o.label} selected={cfg.muzzle === o.id} onClick={() => set({ muzzle: o.id })}>{thumb({ muzzle: o.id })}</Tile>)
      case 'size':
        return SIZES.map((o) => <Tile key={o.label} label={o.label} selected={cfg.size === o.v} onClick={() => set({ size: o.v })}>{thumb({ size: o.v })}</Tile>)
      case 'body':
        return BODIES.map((o) => <Tile key={o.label} label={o.label} selected={cfg.body === o.v} onClick={() => set({ body: o.v })}>{thumb({ body: o.v })}</Tile>)
      case 'accessory':
        return ACCESSORIES.map((o) => {
          const id = o.id
          const selected = id === null ? cfg.accessories.length === 0 : cfg.accessories.includes(id)
          const toggle = () => {
            if (id === null) set({ accessories: [] })
            else set({ accessories: cfg.accessories.includes(id) ? cfg.accessories.filter((a) => a !== id) : [...cfg.accessories, id] })
          }
          return <Tile key={o.label} label={o.label} selected={selected} onClick={toggle}>{thumb({ accessories: id ? [id] : [] })}</Tile>
        })
      case 'ground':
        return GROUNDS.map((o) => <Tile key={o.label} label={o.label} selected={cfg.ground === o.id} onClick={() => set({ ground: o.id })}>{thumb({ ground: o.id })}</Tile>)
      default:
        return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.key, cfg, imgs])

  if (!imgs) return <><PaperBg /><div className="maker loading">Loading the dog kit…</div></>

  if (!started) return <><PaperBg /><StartScreen imgs={imgs} sample={sample} onStart={() => setStarted(true)} canInstall={!!installEvt} onInstall={install} /></>

  return (
    <>
    <PaperBg />
    <div className="maker">
      <header className="maker-head">
        <button type="button" className="brand brand-btn" onClick={() => setStarted(false)} aria-label="Back to start">Dog Maker</button>
        <div className="head-actions">
          <button type="button" className="ghost" onClick={() => setCfg({ ...randomConfig(), name: cfg.name })}>🎲 Surprise me</button>
          <button type="button" className="ghost" onClick={() => { setCfg(DEFAULT_CONFIG); setStep(0) }}>↺ Start over</button>
        </div>
      </header>

      <div className="preview">
        <DogView cfg={cfg} imgs={imgs} px={360} />
      </div>

      <nav className="dots" aria-label="steps">
        {STEPS.map((s, i) => (
          <button key={s.key} type="button" className={'dot' + (i === step ? ' on' : '') + (i < step ? ' done' : '')} aria-label={s.q} onClick={() => setStep(i)} />
        ))}
      </nav>

      <section className="step">
        <h2>{cur.q}</h2>
        {cur.key === 'spot' ? (
          <>
            <h3 className="substep">Pattern</h3>
            <div className="tiles">
              {SPOT_PATTERNS.map((p) => (
                <Tile key={p.label} label={p.label} selected={cfg.spotPattern === p.id} onClick={() => set({ spotPattern: p.id })}>
                  <DogView cfg={variant({ spotPattern: p.id })} imgs={imgs!} />
                </Tile>
              ))}
            </div>
            {cfg.spotPattern && (<>
              <h3 className="substep">Spot colour</h3>
              <div className="tiles">
                {SPOT_COLORS.map((c) => (
                  <Tile key={c.hex} label={c.label} selected={cfg.spotColor === c.hex} onClick={() => set({ spotColor: c.hex })}>
                    <DogView cfg={variant({ spotColor: c.hex })} imgs={imgs!} />
                  </Tile>
                ))}
              </div>
            </>)}
          </>
        ) : (
          <div className="tiles">{tiles}</div>
        )}
      </section>

      <footer className={`maker-foot${last ? ' foot-share' : ''}`}>
        {last ? (
          <>
            <button type="button" className="back-mini" onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label="Back">←</button>
            <div className="share-grid">
              <button type="button" className="cta wa-btn" disabled={saving} onClick={() => run(shareWhatsAppSticker)}>💚 WhatsApp</button>
              <button type="button" className="cta save-btn" disabled={saving} onClick={() => run(downloadPhoto)}>📷 Save photo</button>
              <button type="button" className="cta share-btn" disabled={saving} onClick={() => run(sharePhoto)}>📤 Share</button>
              <button type="button" className="cta mc-btn" disabled={saving} onClick={() => setShowMc(true)}>⛏️ Minecraft</button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="nav" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
            <button type="button" className="cta" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next →</button>
          </>
        )}
      </footer>
      {showMc && <McHelp onClose={() => setShowMc(false)} onDownload={downloadMcpack} />}
    </div>
    </>
  )
}
