import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEventCircle,
  deleteEventCircle,
  fetchEventCircle,
  updateEventCircle,
} from '../services/eventCircleApi.js'
import EventCircleManager from './EventCircleManager.jsx'

vi.mock('../services/eventCircleApi.js', () => ({
  createEventCircle: vi.fn(),
  deleteEventCircle: vi.fn(),
  fetchEventCircle: vi.fn(),
  updateEventCircle: vi.fn(),
}))
vi.mock('../utils/eventCircleCover.js', () => ({ downloadEventCircleCover: vi.fn() }))

const event = { category: 'Hackathon', city: 'Nairobi', id: 42, name: 'Nairobi Build Weekend' }

describe('EventCircleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a secure attendee circle from the organizer setup form', async () => {
    const user = userEvent.setup()
    fetchEventCircle.mockRejectedValue({ status: 404 })
    createEventCircle.mockResolvedValue({
      eventId: 42,
      inviteUrl: 'https://chat.whatsapp.com/build-room',
      welcomeMessage: 'Welcome builders',
    })
    render(<EventCircleManager event={event} />)

    const invite = await screen.findByRole('textbox', { name: /whatsapp group invite/i })
    await user.type(invite, 'https://chat.whatsapp.com/build-room')
    const welcome = screen.getByRole('textbox', { name: /welcome note/i })
    await user.clear(welcome)
    await user.type(welcome, '  Welcome builders  ')
    await user.click(screen.getByRole('button', { name: /open attendee circle/i }))

    expect(createEventCircle).toHaveBeenCalledWith(42, {
      inviteUrl: 'https://chat.whatsapp.com/build-room',
      welcomeMessage: 'Welcome builders',
    })
    expect(await screen.findByText(/circle is now open/i)).toBeInTheDocument()
  })

  it('updates and closes an existing circle only after confirmation', async () => {
    const user = userEvent.setup()
    fetchEventCircle.mockResolvedValue({
      eventId: 42,
      inviteUrl: 'https://chat.whatsapp.com/old-room',
      welcomeMessage: 'Hello',
    })
    updateEventCircle.mockResolvedValue({
      eventId: 42,
      inviteUrl: 'https://chat.whatsapp.com/new-room',
      welcomeMessage: 'Hello',
    })
    deleteEventCircle.mockResolvedValue(undefined)
    render(<EventCircleManager event={event} />)

    const invite = await screen.findByRole('textbox', { name: /whatsapp group invite/i })
    await user.clear(invite)
    await user.type(invite, 'https://chat.whatsapp.com/new-room')
    await user.click(screen.getByRole('button', { name: /update attendee circle/i }))
    expect(updateEventCircle).toHaveBeenCalledWith(42, expect.objectContaining({ inviteUrl: 'https://chat.whatsapp.com/new-room' }))

    await user.click(screen.getByRole('button', { name: /close attendee circle/i }))
    expect(deleteEventCircle).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /^close circle$/i }))
    expect(deleteEventCircle).toHaveBeenCalledWith(42)
    expect(await screen.findByText(/circle closed/i)).toBeInTheDocument()
  })
})
