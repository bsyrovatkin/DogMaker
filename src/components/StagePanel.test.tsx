// src/components/StagePanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { StagePanel } from './StagePanel'
import { defaultConfig } from '../catalog/config'

describe('StagePanel', () => {
  it('renders the preview and fires Random', () => {
    const onRandom = vi.fn()
    const { getByText, container } = render(
      <StagePanel config={defaultConfig()} onRandom={onRandom} onDownload={vi.fn()} onShare={vi.fn()} />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
    fireEvent.click(getByText(/Random/i))
    expect(onRandom).toHaveBeenCalled()
  })

  it('fires Download', () => {
    const onDownload = vi.fn()
    const { getByText } = render(
      <StagePanel config={defaultConfig()} onRandom={vi.fn()} onDownload={onDownload} onShare={vi.fn()} />,
    )
    fireEvent.click(getByText(/Download/i))
    expect(onDownload).toHaveBeenCalled()
  })
})
