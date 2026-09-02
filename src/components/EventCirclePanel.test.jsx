import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth.js'
import { fetchEventCircle } from '../services/eventCircleApi.js'
import EventCirclePanel from './EventCirclePanel.jsx'

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../services/eventCircleApi.js', () => ({ fetchEventCircle: vi.fn() }))

const event = { hasCircle: true, id: 42, name: 'Nairobi Build Weekend', ownerId: 99 }

function renderPanel() {
  return render(<MemoryRouter initialEntries={['/events/42']}><EventCirclePanel event={event} /></MemoryRouter>)
}

describe('EventCirclePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ authenticated: true, user: { id: 7 } })
  })

  it('never requests or exposes the invite to an anonymous visitor', () => {
    useAuth.mockReturnValue({ authenticated: false, user: null })
    renderPanel()

    expect(screen.getByRole('heading', { name: /conversation starts early/i })).toBeInTheDocument()
    expect(fetchEventCircle).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: /join whatsapp/i })).not.toBeInTheDocument()
  })

  it('keeps the invite hidden when the API denies an unbooked user', async () => {
    fetchEventCircle.mockRejectedValue({ status: 403 })
    renderPanel()

    expect(await screen.findByRole('heading', { name: /book first/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /join whatsapp/i })).not.toBeInTheDocument()
  })

  it('shows the private invite and copies the welcome note for an authorized attendee', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    fetchEventCircle.mockResolvedValue({
      eventId: 42,
      inviteUrl: 'https://chat.whatsapp.com/secret-room',
      welcomeMessage: 'Introduce yourself before Saturday.',
    })
    renderPanel()

    const join = await screen.findByRole('link', { name: /join whatsapp circle/i })
    expect(join).toHaveAttribute('href', 'https://chat.whatsapp.com/secret-room')
    await user.click(screen.getByRole('button', { name: /copy welcome note/i }))
    expect(writeText).toHaveBeenCalledWith('Introduce yourself before Saturday.')
  })
})
