import { useEffect, useRef } from 'react'
import { loadImage, recolor } from '../raster/recolor'
import { composeDog } from '../raster/composeDog'
import { EYE_ANCHOR, MUZZLE_ANCHOR, GROUND_ANCHOR, ACCESSORY } from '../raster/anchors'

const FURS = ['curly', 'shaggy', 'smooth', 'fluffy']
const EARS = ['floppy', 'pointy', 'round']

const PALETTE: [string, string][] = [
  ['classic', '#c98a5e'], ['chocolate', '#6b4a2f'], ['golden', '#e0aa55'], ['black', '#3a3330'],
  ['cream', '#ead8bd'], ['caramel', '#a9713f'], ['apricot', '#dd9a6e'], ['fawn', '#cbab83'],
  ['red', '#b15a36'], ['grey', '#9a9a9a'], ['white', '#f2ece2'], ['silver', '#8f99a6'],
  ['pink', '#e6a0b0'], ['mint', '#9fccb6'], ['sky', '#9db9dd'], ['lavender', '#b3a3d1'],
]
const SIZES: [string, number][] = [['tiny', 0.55], ['small', 0.78], ['normal', 1], ['big', 1.3], ['giant', 1.6]]
const WIDTHS: [string, number][] = [['thin', 0.78], ['normal', 1], ['big', 1.25]]

const url = (name: string) => `${import.meta.env.BASE_URL}bases/${name}.png`
const part = (name: string) => `${import.meta.env.BASE_URL}parts/${name}.png`

function tile(label: string, node: HTMLElement): HTMLElement {
  const fig = document.createElement('figure')
  fig.style.cssText = 'margin:0;text-align:center'
  node.style.cssText += ';border:1px solid #eee;border-radius:10px;background:#f6f1ea;display:block'
  const cap = document.createElement('figcaption')
  cap.textContent = label
  cap.style.cssText = 'font-size:11px;margin-top:2px;color:#555'
  fig.appendChild(node)
  fig.appendChild(cap)
  return fig
}

async function tryLoad(src: string): Promise<HTMLImageElement | null> {
  try { return await loadImage(src) } catch { return null }
}

export function BaseLab() {
  const fullRef = useRef<HTMLDivElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)
  const eyeTuneRef = useRef<HTMLDivElement>(null)
  const muzTuneRef = useRef<HTMLDivElement>(null)
  const verifyRef = useRef<HTMLDivElement>(null)
  const recolorRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const eyes = await tryLoad(part('eyes-dots'))
      const muzzle = await tryLoad(part('muzzle-smile'))

      // 0) FULL dog — every layer: ground + base + recolour + eyes + muzzle + accessory
      const fullDemo: [string, string, string, string][] = [
        ['curly-floppy', '#c98a5e', 'collar', 'grass'],
        ['smooth-pointy', '#e0aa55', 'scarf', 'cloud'],
        ['fluffy-round', '#e6a0b0', 'bandana', 'flowers'],
        ['shaggy-floppy', '#6b4a2f', 'wings', 'pillow'],
      ]
      for (const [name, color, acc, bg] of fullDemo) {
        const base = await tryLoad(url(name))
        const accImg = await tryLoad(part('acc-' + acc))
        const bgImg = await tryLoad(part('bg-' + bg))
        if (cancelled) return
        if (!base) continue
        const accDef = ACCESSORY[acc]
        const cv = composeDog({
          base, color, size: 220,
          eyes: eyes ?? undefined, eyeAnchor: eyes ? EYE_ANCHOR : undefined,
          muzzle: muzzle ?? undefined, muzzleAnchor: muzzle ? MUZZLE_ANCHOR : undefined,
          ground: bgImg ?? undefined, groundAnchor: bgImg ? GROUND_ANCHOR : undefined,
          accessory: accImg ?? undefined, accessoryAnchor: accImg ? accDef.anchor : undefined, accessoryBack: accDef.back, accessoryCropTop: accDef.cropTop,
        })
        cv.style.cssText = 'width:190px;height:auto'
        fullRef.current?.appendChild(tile(`${name} · ${acc} · ${bg}`, cv))
      }

      // 1) full composed portraits — base + recolour + eyes + muzzle
      const demo: [string, string][] = [['curly-floppy', '#c98a5e'], ['smooth-pointy', '#6b4a2f'], ['fluffy-round', '#e0aa55'], ['shaggy-floppy', '#3a3330']]
      for (const [name, color] of demo) {
        const base = await tryLoad(url(name))
        if (cancelled) return
        if (!base) continue
        const cv = composeDog({
          base, color, size: 200,
          eyes: eyes ?? undefined, eyeAnchor: eyes ? EYE_ANCHOR : undefined,
          muzzle: muzzle ?? undefined, muzzleAnchor: muzzle ? MUZZLE_ANCHOR : undefined,
        })
        cv.style.cssText = 'width:170px;height:auto'
        portraitRef.current?.appendChild(tile(name, cv))
      }

      const tuneBase = await tryLoad(url('curly-floppy'))

      // 2) eye-height tuning (muzzle fixed)
      if (tuneBase && eyes) {
        for (const cy of [0.27, 0.31, 0.35, 0.39]) {
          const cv = composeDog({
            base: tuneBase, color: '#c98a5e', size: 200,
            eyes, eyeAnchor: { ...EYE_ANCHOR, cy },
            muzzle: muzzle ?? undefined, muzzleAnchor: muzzle ? MUZZLE_ANCHOR : undefined,
          })
          cv.style.cssText = 'width:150px;height:auto'
          eyeTuneRef.current?.appendChild(tile('eyes cy=' + cy, cv))
        }
      }

      // 3) muzzle-height tuning (eyes fixed)
      if (tuneBase && muzzle) {
        for (const cy of [0.38, 0.42, 0.46, 0.50]) {
          const cv = composeDog({
            base: tuneBase, color: '#c98a5e', size: 200,
            eyes: eyes ?? undefined, eyeAnchor: eyes ? EYE_ANCHOR : undefined,
            muzzle, muzzleAnchor: { ...MUZZLE_ANCHOR, cy },
          })
          cv.style.cssText = 'width:150px;height:auto'
          muzTuneRef.current?.appendChild(tile('muzzle cy=' + cy, cv))
        }
      }

      // 4) verify grid — every base, raw
      for (const ears of EARS) {
        for (const fur of FURS) {
          const name = `${fur}-${ears}`
          const ok = await tryLoad(url(name))
          if (cancelled) return
          if (!ok) continue
          const im = document.createElement('img')
          im.src = url(name)
          im.style.cssText = 'width:96px;height:auto'
          verifyRef.current?.appendChild(tile(name, im))
        }
      }

      // 5) recolour + size + width
      const img = await tryLoad(url('curly-floppy'))
      if (img) {
        const ratio = img.naturalHeight / img.naturalWidth
        const W = 130
        for (const [label, hex] of PALETTE) {
          const cv = recolor(img, W, W * ratio, hex)
          cv.style.cssText = 'width:116px;height:auto'
          recolorRef.current?.appendChild(tile(label, cv))
        }
        for (const [label, s] of SIZES) {
          const cv = recolor(img, W, W * ratio, '#c98a5e')
          cv.style.cssText = `width:${130 * s}px;height:auto`
          sizeRef.current?.appendChild(tile(label, cv))
        }
        for (const [label, sx] of WIDTHS) {
          const cv = recolor(img, W, W * ratio, '#c98a5e')
          cv.style.cssText = `width:${130 * sx}px;height:${130 * ratio}px`
          widthRef.current?.appendChild(tile(label, cv))
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 12 }
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Base lab</h2>
      <h3>Full dog — ground + base + colour + eyes + nose/mouth + accessory</h3>
      <div ref={fullRef} style={row} />
      <h3 style={{ marginTop: 28 }}>Full portrait — base + recolour + eyes + nose/mouth</h3>
      <div ref={portraitRef} style={row} />
      <h3 style={{ marginTop: 28 }}>Eye height tuning</h3>
      <div ref={eyeTuneRef} style={row} />
      <h3 style={{ marginTop: 28 }}>Muzzle height tuning</h3>
      <div ref={muzTuneRef} style={row} />
      <h3 style={{ marginTop: 28 }}>All 12 bases — verify naming</h3>
      <div ref={verifyRef} style={row} />
      <h3 style={{ marginTop: 28 }}>Recolour — {PALETTE.length} colours</h3>
      <div ref={recolorRef} style={row} />
      <h3 style={{ marginTop: 28 }}>Size — uniform scale</h3>
      <div ref={sizeRef} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }} />
      <h3 style={{ marginTop: 28 }}>Width — horizontal scale</h3>
      <div ref={widthRef} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }} />
    </div>
  )
}
