import { useDogConfig } from './state/useDogConfig'
import { StagePanel } from './components/StagePanel'
import { OptionsPanel } from './components/OptionsPanel'
import { exportSticker } from './export/exportSticker'
import { Gallery } from './components/Gallery'

export default function App() {
  const { config, select, randomize, shareUrl } = useDogConfig()

  if (typeof window !== 'undefined' && window.location.hash.includes('gallery')) {
    return <Gallery />
  }

  async function handleShare() {
    const url = shareUrl()
    const nav = navigator as Navigator & { share?: (d: { url: string; title?: string }) => Promise<void> }
    if (nav.share) {
      try { await nav.share({ url, title: 'My DogMaker dog' }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); alert('Link copied!') }
      catch { alert('Could not copy the link.') }
    }
  }

  async function handleDownload() {
    try {
      await exportSticker(config)
    } catch {
      alert("Sorry — couldn't make the sticker. Please try again.")
    }
  }

  return (
    <div className="app">
      <StagePanel
        config={config}
        onRandom={randomize}
        onDownload={handleDownload}
        onShare={handleShare}
      />
      <OptionsPanel config={config} onSelect={select} />
    </div>
  )
}
