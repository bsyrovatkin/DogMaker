import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { preloadAll } from '../raster/assets'
import { drawDogTo } from '../raster/renderDog'
import { saveSticker } from '../raster/exportDog'
import {
  FURS, EARS, COLORS, SPOTS, EYES, MUZZLES, SIZES, ACCESSORIES, GROUNDS,
  DEFAULT_CONFIG, randomConfig, type MakerConfig,
} from '../raster/catalog'
import './maker.css'

type Imgs = Map<string, HTMLImageElement>
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> }

/** Draw the dog described by `cfg` into a canvas, scaled by cfg.size, bottom-centered. */
function DogView({ cfg, imgs, px }: { cfg: MakerConfig; imgs: Imgs; px: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    drawDogTo(c, cfg, imgs, Math.round(px * dpr))
  }, [cfg.fur, cfg.ears, cfg.color, cfg.spot, cfg.eyes, cfg.muzzle, cfg.size, cfg.accessories.join(','), cfg.ground, imgs, px])
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

function isIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}
function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function StartScreen({ imgs, sample, onStart, canInstall, onInstall }: { imgs: Imgs; sample: MakerConfig; onStart: () => void; canInstall: boolean; onInstall: () => void }) {
  const [howTo, setHowTo] = useState<null | 'ios' | 'desktop'>(null)
  const installed = isStandalone()
  const ios = isIOS()
  const showInstall = !installed
  function handleInstall() {
    if (canInstall) { onInstall(); return }
    setHowTo(ios ? 'ios' : 'desktop')
  }
  return (
    <div className="start">
      <h1 className="brand">Margo's Dogs</h1>
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
            <li>Tap <b>Add</b>. The Margo’s Dogs icon will appear on your home screen.</li>
          </ol>
        ) : (
          <ol className="howto">
            <li>In Chrome or Edge, click the <b>install</b> icon <span className="key">⊕</span> in the address bar.</li>
            <li>Or open the menu <span className="key">⋮</span> and pick <b>«Install Margo’s Dogs»</b>.</li>
          </ol>
        )}
        <button type="button" className="cta" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

const STEPS: { key: string; q: string }[] = [
  { key: 'fur', q: 'What kind of fur?' },
  { key: 'ears', q: 'Pick the ears' },
  { key: 'color', q: 'Choose a colour' },
  { key: 'spot', q: 'Add some spots?' },
  { key: 'eyes', q: 'Pick the eyes' },
  { key: 'muzzle', q: 'Pick the mouth' },
  { key: 'size', q: 'How big?' },
  { key: 'accessory', q: 'Add accessories — pick as many as you like' },
  { key: 'ground', q: 'Where does it sit?' },
]

const THUMB = 200

export function Maker() {
  const [imgs, setImgs] = useState<Imgs | null>(null)
  const [cfg, setCfg] = useState<MakerConfig>(DEFAULT_CONFIG)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [started, setStarted] = useState(false)
  const [sample] = useState<MakerConfig>(() => ({ ...randomConfig(), accessories: ['partyhat'], ground: 'grass' }))
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null)

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

  async function handleSave() {
    if (!imgs) return
    setSaving(true)
    try { await saveSticker(cfg, imgs) }
    catch { alert("Sorry — couldn't make the sticker. Please try again.") }
    finally { setSaving(false) }
  }

  const tiles = useMemo(() => {
    if (!imgs) return null
    const thumb = (v: Partial<MakerConfig>) => <DogView cfg={variant(v)} imgs={imgs} px={THUMB} />
    switch (cur.key) {
      case 'fur':
        return FURS.map((o) => <Tile key={o.id} label={o.label} selected={cfg.fur === o.id} onClick={() => set({ fur: o.id })}>{thumb({ fur: o.id })}</Tile>)
      case 'ears':
        return EARS.map((o) => <Tile key={o.id} label={o.label} selected={cfg.ears === o.id} onClick={() => set({ ears: o.id })}>{thumb({ ears: o.id })}</Tile>)
      case 'color':
        return COLORS.map((o) => <Tile key={o.hex} label={o.label} selected={cfg.color === o.hex} onClick={() => set({ color: o.hex })}>{thumb({ color: o.hex })}</Tile>)
      case 'spot':
        return SPOTS.map((o) => <Tile key={o.label} label={o.label} selected={cfg.spot === o.hex} onClick={() => set({ spot: o.hex })}>{thumb({ spot: o.hex })}</Tile>)
      case 'eyes':
        return EYES.map((o) => <Tile key={o.id} label={o.label} selected={cfg.eyes === o.id} onClick={() => set({ eyes: o.id })}>{thumb({ eyes: o.id })}</Tile>)
      case 'muzzle':
        return MUZZLES.map((o) => <Tile key={o.id} label={o.label} selected={cfg.muzzle === o.id} onClick={() => set({ muzzle: o.id })}>{thumb({ muzzle: o.id })}</Tile>)
      case 'size':
        return SIZES.map((o) => <Tile key={o.label} label={o.label} selected={cfg.size === o.v} onClick={() => set({ size: o.v })}>{thumb({ size: o.v })}</Tile>)
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
        <button type="button" className="brand brand-btn" onClick={() => setStarted(false)} aria-label="Back to start">Margo's Dogs</button>
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
        <div className="tiles">{tiles}</div>
      </section>

      <footer className="maker-foot">
        <button type="button" className="nav" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
        {last ? (
          <button type="button" className="cta" disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : '🎉 Save sticker'}</button>
        ) : (
          <button type="button" className="cta" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next →</button>
        )}
      </footer>
    </div>
    </>
  )
}
