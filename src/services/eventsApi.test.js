import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeEvent, normalizeTicket } from './eventsApi.js'

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
