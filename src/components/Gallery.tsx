import { catalog } from '../catalog'
import { defaultConfig, randomConfig } from '../catalog/config'
import { DogRenderer } from '../render/DogRenderer'

export function Gallery() {
  const base = defaultConfig()
  return (
    <div style={{ padding: 16 }}>
      <h2>Gallery (QA)</h2>
      {catalog.map((cat) => (
        <section key={cat.key} style={{ marginBottom: 24 }}>
          <h3>{cat.label}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {cat.options.map((opt) => (
              <div key={opt.id} style={{ width: 120, textAlign: 'center' }}>
                <DogRenderer config={{ ...base, [cat.key]: opt.id }} size={120} />
                <small>{opt.label}</small>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h3>Random</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: 120 }}>
              <DogRenderer config={randomConfig()} size={120} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
