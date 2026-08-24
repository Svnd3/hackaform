import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEvent,
  fetchUpcomingEvents,
  normalizeEvent,
} from './eventsApi.js'

const flaskEvent = {
  agendaItems: [],
  availableSpots: 42,
  bookedSpots: 8,
  capacity: 50,
  category: 'Technology',
  city: 'Nairobi',
  description: '<p>A practical evening for web builders.</p>',
  endAt: '2030-04-04T20:00:00+03:00',
  format: 'in-person',
  id: 7,
  organizer: 'Amina Kamau',
  ownerId: 2,
  startAt: '2030-04-04T18:00:00+03:00',
  status: 'published',
  timezone: 'Africa/Nairobi',
  title: 'Frontend Futures',
  venue: 'Nairobi Garage',
}

describe('Flask event service', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('normalizes backend events into the established card contract', () => {
    const event = normalizeEvent(flaskEvent)
    expect(event).toMatchObject({
      availableSpots: 42,
      locationLabel: 'Nairobi Garage, Nairobi',
      name: 'Frontend Futures',
      online: false,
      organizer: 'Amina Kamau',
      startsAt: flaskEvent.startAt,
    })
    expect(event.description).toBe('A practical evening for web builders.')
  })

  it('loads the catalogue from the Flask API rather than a public provider', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [flaskEvent], meta: { total: 1 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    const events = await fetchUpcomingEvents({ pageSize: 24 })
    expect(events).toHaveLength(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/events?page=1&perPage=24')
  })

  it('sends controlled event data to the authenticated create endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: flaskEvent }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }),
    )

    const event = await createEvent({ title: 'Frontend Futures' })
    expect(event.name).toBe('Frontend Futures')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events',
      expect.objectContaining({ body: JSON.stringify({ title: 'Frontend Futures' }), method: 'POST' }),
    )
  })
})
