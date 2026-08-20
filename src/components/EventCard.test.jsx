import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SavedEventsProvider } from '../context/SavedEventsContext.jsx'
import EventCard from './EventCard.jsx'

const event = {
  category: 'Technology',
  id: 'event-7',
  locationLabel: 'Nairobi, Kenya',
  name: 'Frontend Futures',
  online: false,
  shortDescription: 'A meetup for web builders.',
  startsAt: '2030-04-04T10:00:00.000Z',
}

function renderCard() {
  return render(
    <MemoryRouter>
      <SavedEventsProvider>
        <EventCard event={event} />
      </SavedEventsProvider>
    </MemoryRouter>,
  )
}

describe('EventCard', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders meaningful event details and a detail-page link', () => {
    renderCard()

    expect(screen.getByRole('heading', { name: event.name })).toBeInTheDocument()
    expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: event.name })).toHaveAttribute(
      'href',
      '/events/event-7',
    )
  })

  it('saves and removes an event with accessible pressed state', async () => {
    const user = userEvent.setup()
    renderCard()
    const saveButton = screen.getByRole('button', { name: `Save ${event.name}` })

    await user.click(saveButton)
    expect(saveButton).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(window.localStorage.getItem('tukio:saved-events'))).toHaveLength(1)

    await user.click(saveButton)
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')
    expect(JSON.parse(window.localStorage.getItem('tukio:saved-events'))).toHaveLength(0)
  })
})
