// src/state/useDogConfig.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDogConfig } from './useDogConfig'

describe('useDogConfig', () => {
  it('select updates a single category', () => {
    const { result } = renderHook(() => useDogConfig())
    act(() => result.current.select('ears', 'ears-round'))
    expect(result.current.config.ears).toBe('ears-round')
  })

  it('randomize replaces the whole config with a valid one', () => {
    const { result } = renderHook(() => useDogConfig())
    act(() => result.current.randomize())
    expect(typeof result.current.config.bodyType).toBe('string')
  })

  it('shareUrl embeds the encoded config in the hash', () => {
    const { result } = renderHook(() => useDogConfig())
    act(() => result.current.select('eyes', 'eyes-sparkle'))
    expect(result.current.shareUrl()).toContain('#dog=')
  })
})
