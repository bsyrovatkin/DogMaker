import { useDogConfig } from './state/useDogConfig'
import { StagePanel } from './components/StagePanel'
import { OptionsPanel } from './components/OptionsPanel'
import { exportSticker } from './export/exportSticker'

export default function App() {
  const { config, select, randomize, shareUrl } = useDogConfig()

  async function handleShare() {
    const url = shareUrl()
    const nav = navigator as Navigator & { share?: (d: { url: string; title?: string }) => Promise<void> }
    try {
      if (nav.share) await nav.share({ url, title: 'My DogMaker dog' })
      else { await navigator.clipboard.writeText(url); alert('Link copied!') }
    } catch {
      /* cancelled */
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
