import type { Category, DogConfig } from '../types'
import { OptionTile } from './OptionTile'

export function CategorySection({
  category, config, onSelect,
}: {
  category: Category
  config: DogConfig
  onSelect: (key: Category['key'], id: string) => void
}) {
  return (
    <section className="cat-section">
      <h4>{category.label}</h4>
      <div className="tile-row">
        {category.options.map((opt) => (
          <OptionTile
            key={opt.id}
            categoryKey={category.key}
            option={opt}
            selected={config[category.key] === opt.id}
            onSelect={(id) => onSelect(category.key, id)}
          />
        ))}
      </div>
    </section>
  )
}
