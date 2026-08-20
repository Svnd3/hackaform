import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeEvent, normalizeGdgEvent, normalizeTicket } from './eventsApi.js'

describe('Eventyay normalization', () => {
  it('maps kebab-cased JSON:API event data into the UI contract', () => {
    const event = normalizeEvent({
      attributes: {
        description: '<p>A hands-on <b>developer</b> session.</p>',
        'ends-at': '2030-03-12T16:00:00Z',
        'location-name': 'iHub Nairobi',
        name: 'Open Source Developer Day',
        online: false,
        privacy: 'public',
        state: 'published',
        'starts-at': '2030-03-12T09:00:00Z',
      },
      id: '42',
      type: 'event',
    })

    expect(event).toMatchObject({
      category: 'Technology',
      description: 'A hands-on developer session.',
      id: '42',
      locationLabel: 'iHub Nairobi',
      name: 'Open Source Developer Day',
    })
  })

  it('normalizes free admission tickets', () => {
    expect(
      normalizeTicket({ attributes: { name: 'Community pass', price: 10, type: 'free' }, id: '5' }),
    ).toMatchObject({ id: '5', name: 'Community pass', price: 0, type: 'free' })
  })
})

const upcomingContest = {
  durationSeconds: 7200,
  id: 9876,
  name: 'Codeforces Round Test',
  phase: 'BEFORE',
  startTimeSeconds: Date.parse('2100-06-01T12:00:00Z') / 1000,
  type: 'CF',
}

function codeforcesResponse() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: vi.fn().mockResolvedValue(
      JSON.stringify({ result: [upcomingContest], status: 'OK' }),
    ),
  }
}

describe('Codeforces request cache', () => {
  beforeEach(() => vi.resetModules())

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reuses a fresh response and refreshes it after the 60-second TTL', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const fetchMock = vi.fn().mockResolvedValue(codeforcesResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { fetchCodeforcesEvents } = await import('./eventsApi.js')
    const options = { from: '2099-01-01T00:00:00Z' }

    await fetchCodeforcesEvents(options)
    await fetchCodeforcesEvents(options)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    now += 60_001
    await fetchCodeforcesEvents(options)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent requests', async () => {
    let completeRequest
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          completeRequest = () => resolve(codeforcesResponse())
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchCodeforcesEvents } = await import('./eventsApi.js')
    const options = { from: '2099-01-01T00:00:00Z' }

    const first = fetchCodeforcesEvents(options)
    const second = fetchCodeforcesEvents(options)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    completeRequest()
    const [firstResult, secondResult] = await Promise.all([first, second])
    expect(firstResult[0].id).toBe('cf-9876')
    expect(secondResult[0].id).toBe('cf-9876')
  })

  it('lets one caller abort without cancelling the shared request or cache fill', async () => {
    let completeRequest
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          completeRequest = () => resolve(codeforcesResponse())
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchCodeforcesEvents } = await import('./eventsApi.js')
    const options = { from: '2099-01-01T00:00:00Z' }
    const controller = new AbortController()

    const continuingCaller = fetchCodeforcesEvents(options)
    const cancelledCaller = fetchCodeforcesEvents({ ...options, signal: controller.signal })
    controller.abort()

    await expect(cancelledCaller).rejects.toMatchObject({ name: 'AbortError' })
    completeRequest()
    await expect(continuingCaller).resolves.toHaveLength(1)
    await expect(fetchCodeforcesEvents(options)).resolves.toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

const gdgKenyaEvent = {
  chapter: {
    city: 'Nairobi',
    country: 'KE',
    country_name: 'Kenya',
    timezone: 'Africa/Nairobi',
    title: 'GDG Nairobi',
  },
  city: 'Nairobi',
  description_short:
    '<p>A hands-on Android developer meetup.</p><script>window.bad = true</script>',
  event_type_title: 'Free registration',
  id: 115595,
  picture: {
    url: 'https://res.cloudinary.com/example/image/upload/gdg-nairobi.png',
  },
  result_type: 'upcoming_event',
  start_date: '2100-08-22T11:00:00+03:00',
  tags: ['Android', 'Workshop / hands-on session'],
  title: 'Android254 | KotlinKenya Meetup',
  url: 'https://gdg.community.dev/events/details/google-gdg-nairobi-presents-android254/',
}

function jsonResponse(payload, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
  }
}

function gdgSearchResponse(results = [gdgKenyaEvent]) {
  return jsonResponse({ location: null, results })
}

describe('GDG Community Kenya integration', () => {
  beforeEach(() => vi.resetModules())

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('normalizes and sanitizes a Kenyan GDG search event', () => {
    const event = normalizeGdgEvent(gdgKenyaEvent)

    expect(event).toMatchObject({
      category: 'Technology',
      countryCode: 'KE',
      description: 'A hands-on Android developer meetup.',
      id: 'gdg-115595',
      isFree: true,
      isKenyan: true,
      locationLabel: 'Nairobi, Kenya',
      organizer: 'GDG Nairobi',
      priceLabel: 'Free',
      source: 'GDG Community',
      ticketUrl: gdgKenyaEvent.url,
    })
  })

  it('rejects non-GDG registration links during normalization', () => {
    const event = normalizeGdgEvent({
      ...gdgKenyaEvent,
      id: 99,
      url: 'https://example.com/not-the-organizer',
    })

    expect(event.ticketUrl).toBeNull()
    expect(event.externalUrl).toBeNull()
  })

  it('strictly removes neighbouring-country results and caches the search response', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const ugandaEvent = {
      ...gdgKenyaEvent,
      chapter: { ...gdgKenyaEvent.chapter, country: 'UG', title: 'GDG Kampala' },
      city: 'Kampala',
      id: 44,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValue(gdgSearchResponse([ugandaEvent, gdgKenyaEvent]))
    vi.stubGlobal('fetch', fetchMock)
    const { fetchGdgKenyaEvents, GDG_KENYA_SEARCH_URL } = await import('./eventsApi.js')
    const options = { from: '2099-01-01T00:00:00Z' }

    await expect(fetchGdgKenyaEvents(options)).resolves.toMatchObject([
      { countryCode: 'KE', id: 'gdg-115595' },
    ])
    await fetchGdgKenyaEvents(options)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(GDG_KENYA_SEARCH_URL)

    now += 5 * 60_000 + 1
    await fetchGdgKenyaEvents(options)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resolves and caches full GDG details for the event route', async () => {
    const detail = {
      ...gdgKenyaEvent,
      audience_type: 'IN_PERSON',
      cropped_banner_url:
        'https://res.cloudinary.com/example/image/upload/gdg-nairobi-banner.png',
      description: '<p>Build an Android app with <strong>Kotlin</strong>.</p>',
      end_date: '2100-08-22T15:00:00+03:00',
      event_timezone: 'Africa/Nairobi',
      registration_required: true,
      status: 'Published',
      tickets: [
        {
          currency: 'KES',
          id: 66853,
          price: 0,
          title: 'General Admission',
          total_count: 100,
          visible: true,
        },
      ],
      venue_city: 'Nairobi',
      venue_name: 'Daystar University',
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detail))
    vi.stubGlobal('fetch', fetchMock)
    const { fetchEventById } = await import('./eventsApi.js')

    const first = await fetchEventById('gdg-115595')
    const second = await fetchEventById('gdg-115595')

    expect(first).toMatchObject({
      audienceType: 'IN_PERSON',
      description: 'Build an Android app with Kotlin.',
      endsAt: '2100-08-22T12:00:00.000Z',
      locationLabel: 'Daystar University, Nairobi, Kenya',
      priceLabel: 'Free',
      registrationRequired: true,
    })
    expect(second.id).toBe('gdg-115595')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://gdg.community.dev/api/event/115595/',
    )
  })

  it('keeps GDG results available when every other source is offline', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).startsWith('https://gdg.community.dev/api/search/')) {
        return Promise.resolve(gdgSearchResponse())
      }
      return Promise.reject(new TypeError('offline'))
    })
    vi.stubGlobal('fetch', fetchMock)
    const { fetchUpcomingEvents } = await import('./eventsApi.js')

    await expect(
      fetchUpcomingEvents({ from: '2099-01-01T00:00:00Z', pageSize: 12 }),
    ).resolves.toMatchObject([{ id: 'gdg-115595', source: 'GDG Community' }])
  })

  it('places Kenyan events before earlier global listings in the aggregate', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).startsWith('https://gdg.community.dev/api/search/')) {
        return Promise.resolve(gdgSearchResponse())
      }
      if (String(url).startsWith('https://codeforces.com/api/contest.list')) {
        return Promise.resolve(codeforcesResponse())
      }
      return Promise.reject(new TypeError('offline'))
    })
    vi.stubGlobal('fetch', fetchMock)
    const { fetchUpcomingEvents } = await import('./eventsApi.js')

    const events = await fetchUpcomingEvents({
      from: '2099-01-01T00:00:00Z',
      pageSize: 2,
    })

    expect(events.map((event) => event.id)).toEqual(['gdg-115595', 'cf-9876'])
  })
})
