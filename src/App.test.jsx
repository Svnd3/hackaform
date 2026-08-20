import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { SavedEventsProvider } from './context/SavedEventsContext.jsx'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SavedEventsProvider>
        <App />
      </SavedEventsProvider>
    </MemoryRouter>,
  )
}

describe('application routes', () => {
  it('renders the product story at /about', () => {
    renderAt('/about')
    expect(
      screen.getByRole('heading', { name: /life gets better when we leave the group chat/i }),
    ).toBeInTheDocument()
    expect(document.title).toBe('About — Tukio')
  })

  it('renders a useful not-found view for unknown routes', () => {
    renderAt('/definitely-not-a-page')
    expect(screen.getByRole('heading', { name: /event trail goes nowhere/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /take me home/i })).toHaveAttribute('href', '/')
    expect(document.title).toBe('Page not found — Tukio')
  })
})
