// src/components/OptionsPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { OptionsPanel } from './OptionsPanel'
import { defaultConfig } from '../catalog/config'

describe('OptionsPanel', () => {
  it('renders a section per category and reports selections', () => {
    const onSelect = vi.fn()
    const { getByText, getAllByRole } = render(
      <OptionsPanel config={defaultConfig()} onSelect={onSelect} />,
    )
    // category headers present
    expect(getByText('Body')).toBeTruthy()
    expect(getByText('Ears')).toBeTruthy()
    expect(getByText('Mouth')).toBeTruthy()
    // clicking some tile reports a (key, id) pair
    fireEvent.click(getAllByRole('button')[0])
    expect(onSelect).toHaveBeenCalled()
    const [key, id] = onSelect.mock.calls[0]
    expect(typeof key).toBe('string')
    expect(typeof id).toBe('string')
  })
})
