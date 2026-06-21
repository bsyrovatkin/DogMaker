import type { CategoryKey, Option } from '../types'
import { OptionThumb } from './OptionThumb'

export function OptionTile({
  categoryKey, option, selected, onSelect,
}: {
  categoryKey: CategoryKey
  option: Option
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={`tile${selected ? ' sel' : ''}`}
      aria-pressed={selected}
      title={option.label}
      onClick={() => onSelect(option.id)}
    >
      <OptionThumb categoryKey={categoryKey} option={option} />
    </button>
  )
}
