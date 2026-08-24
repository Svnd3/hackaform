import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchEventBookings } from '../services/bookingsApi.js'
import AttendeeRoster from './AttendeeRoster.jsx'

vi.mock('../services/bookingsApi.js', () => ({ fetchEventBookings: vi.fn() }))

const event = { id: 42, name: 'Nairobi Dev Summit' }

describe('AttendeeRoster', () => {
  beforeEach(() => vi.clearAllMocks())

  it('summarizes confirmed places and lists each booking status', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    fetchEventBookings.mockResolvedValue({
      bookings: [
        { id: 1, quantity: 2, status: 'confirmed', user: { name: 'Amina Kamau' } },
        { attendee: { name: 'Brian Otieno' }, id: 2, quantity: 1, status: 'confirmed' },
        { attendeeName: 'Cancelled Guest', id: 3, quantity: 4, status: 'cancelled' },
      ],
      meta: {},
    })

    render(<AttendeeRoster event={event} onClose={onClose} />)

    expect(await screen.findByText('Amina Kamau')).toBeInTheDocument()
    expect(screen.getByText('Brian Otieno')).toBeInTheDocument()
    expect(screen.getByText('Cancelled Guest')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/confirmed places across 2 active bookings/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close attendee list/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('recovers from a failed roster request when the organizer retries', async () => {
    const user = userEvent.setup()
    fetchEventBookings
      .mockRejectedValueOnce(new Error('Guest list temporarily unavailable.'))
      .mockResolvedValueOnce({
        bookings: [{ id: 4, quantity: 1, status: 'confirmed', user: { name: 'Wanjiku Njeri' } }],
        meta: {},
      })

    render(<AttendeeRoster event={event} onClose={() => {}} />)

    expect(await screen.findByText(/guest list temporarily unavailable/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('Wanjiku Njeri')).toBeInTheDocument()
    expect(fetchEventBookings).toHaveBeenCalledTimes(2)
  })
})
