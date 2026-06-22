// src/App.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  afterEach(() => { window.location.hash = '' })

  it('renders the DogMaker questionnaire on the main route', () => {
    window.location.hash = ''
    const { getByText } = render(<App />)
    // In jsdom the asset preload never resolves, so the Maker stays in its loading state.
    expect(getByText(/Loading the dog kit/i)).toBeTruthy()
  })

  it('renders the legacy maker at #legacy', () => {
    window.location.hash = '#legacy'
    const { container } = render(<App />)
    expect(container.querySelector('.stage')).toBeTruthy()
    expect(container.querySelector('.options-panel')).toBeTruthy()
  })
})
