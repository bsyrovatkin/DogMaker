// src/App.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the stage and the options panel', () => {
    const { container, getByText } = render(<App />)
    expect(container.querySelector('.stage')).toBeTruthy()
    expect(container.querySelector('.options-panel')).toBeTruthy()
    expect(getByText('Body')).toBeTruthy()
  })
})
