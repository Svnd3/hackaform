import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AuthProvider from '../context/AuthProvider.jsx'
import { SavedEventsProvider } from '../context/SavedEventsContext.jsx'
import Navbar from './Navbar.jsx'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <AuthProvider initialUser={null}>
        <SavedEventsProvider>
          <Navbar />
        </SavedEventsProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('links to Home from the desktop and mobile navigation', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const desktopNavigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(desktopNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }))
    const mobileNavigation = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(within(mobileNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('keeps closed mobile links out of the document', () => {
    renderNavbar()

    expect(document.querySelector('#mobile-navigation')).not.toBeInTheDocument()
  })

  it('closes the mobile menu with Escape and restores button focus', async () => {
    const user = userEvent.setup()
    renderNavbar()
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i })

    await user.click(menuButton)
    const mobileNavigation = document.querySelector('#mobile-navigation')
    expect(within(mobileNavigation).getByRole('link', { name: 'Explore' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(document.querySelector('#mobile-navigation')).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })
})
