import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth.js'
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  updateBooking,
} from '../services/bookingsApi.js'
import BookingPanel from './BookingPanel.jsx'

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../services/bookingsApi.js', () => ({
  createBooking: vi.fn(),
  deleteBooking: vi.fn(),
  fetchBookings: vi.fn(),
  updateBooking: vi.fn(),
}))

const event = { availableSpots: 5, id: 42, name: 'Nairobi Dev Summit', ownerId: 99 }
const attendee = { id: 7, name: 'Amina' }

function renderPanel(eventValue = event) {
  return render(
    <MemoryRouter initialEntries={['/events/42']}>
      <BookingPanel event={eventValue} />
    </MemoryRouter>,
  )
}

describe('BookingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ authenticated: true, user: attendee })
  })

  it('creates a booking with the selected quantity and organizer note', async () => {
    const user = userEvent.setup()
    fetchBookings.mockResolvedValue([])
    createBooking.mockResolvedValue({
      eventId: 42,
      id: 81,
      notes: 'Wheelchair access, please',
      quantity: 2,
      status: 'confirmed',
    })
    renderPanel()

    expect(await screen.findByRole('heading', { name: /claim your spot/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add one place/i }))
    await user.type(screen.getByRole('textbox', { name: /note for the organizer/i }), '  Wheelchair access, please  ')
    await user.click(screen.getByRole('button', { name: /confirm booking/i }))

    expect(createBooking).toHaveBeenCalledWith({
      eventId: 42,
      notes: 'Wheelchair access, please',
      quantity: 2,
    })
    expect(await screen.findByRole('heading', { name: /you.re on the list/i })).toBeInTheDocument()
    expect(screen.getByText(/2 places reserved under Amina/i)).toBeInTheDocument()
    expect(screen.getByText(/you have a place/i)).toBeInTheDocument()
  })

  it('updates and then cancels an existing booking through confirmation', async () => {
    const user = userEvent.setup()
    fetchBookings.mockResolvedValue([{ eventId: 42, id: 81, notes: 'Front row', quantity: 1 }])
    updateBooking.mockResolvedValue({ eventId: 42, id: 81, notes: 'Near a socket', quantity: 2 })
    deleteBooking.mockResolvedValue(undefined)
    renderPanel()

    await screen.findByRole('heading', { name: /you.re on the list/i })
    await user.click(screen.getByRole('button', { name: /edit booking/i }))
    await user.click(screen.getByRole('button', { name: /add one place/i }))
    const note = screen.getByRole('textbox', { name: /note for the organizer/i })
    await user.clear(note)
    await user.type(note, '  Near a socket  ')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateBooking).toHaveBeenCalledWith(81, { notes: 'Near a socket', quantity: 2 })
    expect(await screen.findByText(/your booking was updated/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^cancel booking$/i }))
    await user.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(deleteBooking).toHaveBeenCalledWith(81)
    expect(await screen.findByText(/your booking was cancelled/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /claim your spot/i })).toBeInTheDocument()
  })

  it('counts already-held places when editing near capacity', async () => {
    const user = userEvent.setup()
    fetchBookings.mockResolvedValue([
      { eventId: 42, id: 81, notes: '', quantity: 2, status: 'confirmed' },
    ])
    updateBooking.mockResolvedValue({
      eventId: 42,
      id: 81,
      notes: '',
      quantity: 3,
      status: 'confirmed',
    })
    renderPanel({ ...event, availableSpots: 1 })

    await screen.findByRole('heading', { name: /you.re on the list/i })
    await user.click(screen.getByRole('button', { name: /edit booking/i }))
    await user.click(screen.getByRole('button', { name: /add one place/i }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateBooking).toHaveBeenCalledWith(81, { notes: '', quantity: 3 })
  })

  it('shows a sign-in path without requesting private booking data', () => {
    useAuth.mockReturnValue({ authenticated: false, user: null })
    renderPanel()

    expect(screen.getByRole('link', { name: /sign in to book/i })).toHaveAttribute('href', '/login')
    expect(fetchBookings).not.toHaveBeenCalled()
  })
})
