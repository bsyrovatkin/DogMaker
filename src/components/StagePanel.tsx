import type { DogConfig } from '../types'
import { DogRenderer } from '../render/DogRenderer'

export function StagePanel({
  config, onRandom, onDownload, onShare,
}: {
  config: DogConfig
  onRandom: () => void
  onDownload: () => void
  onShare: () => void
}) {
  return (
    <div className="stage">
      <div className="stage-bar">
        <span className="brand">🐶 DogMaker</span>
        <button type="button" className="link-btn" onClick={onShare}>⤴ Share</button>
      </div>
      <div className="stage-main">
        <DogRenderer config={config} size={360} />
      </div>
      <div className="stage-actions">
        <button type="button" className="btn ghost" onClick={onRandom}>🎲 Random</button>
        <button type="button" className="btn primary" onClick={onDownload}>⬇ Download</button>
      </div>
    </div>
  )
}
