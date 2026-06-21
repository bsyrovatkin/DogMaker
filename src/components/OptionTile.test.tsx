// src/components/OptionTile.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { OptionTile } from './OptionTile'

describe('OptionTile', () => {
  const option = { id: 'ears-round', label: 'Round', svg: '<circle/>' }

  it('marks the selected state and fires onSelect', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(
      <OptionTile categoryKey="ears" option={option} selected onSelect={onSelect} />,
    )
    const btn = getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith('ears-round')
  })
})
