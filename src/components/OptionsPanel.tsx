import type { CategoryKey, DogConfig } from '../types'
import { catalog } from '../catalog'
import { CategorySection } from './CategorySection'

export function OptionsPanel({
  config, onSelect,
}: {
  config: DogConfig
  onSelect: (key: CategoryKey, id: string) => void
}) {
  return (
    <div className="options-panel">
      {catalog.map((cat) => (
        <CategorySection key={cat.key} category={cat} config={config} onSelect={onSelect} />
      ))}
    </div>
  )
}
