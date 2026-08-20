import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SavedEventsProvider } from '../context/SavedEventsContext.jsx'
import Navbar from './Navbar.jsx'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <SavedEventsProvider>
        <Navbar />
      </SavedEventsProvider>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
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
