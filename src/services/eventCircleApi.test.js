import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEventCircle,
  deleteEventCircle,
  fetchEventCircle,
  normalizeEventCircle,
  updateEventCircle,
} from './eventCircleApi.js'

describe('eventCircleApi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('normalizes private circle fields from either API naming style', () => {
    expect(normalizeEventCircle({ event_id: 9, invite_url: 'https://chat.whatsapp.com/example', welcome_message: 'Hello' })).toMatchObject({
      eventId: 9,
      inviteUrl: 'https://chat.whatsapp.com/example',
      welcomeMessage: 'Hello',
    })
  })

  it('uses the nested event resource for circle CRUD', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { eventId: 9, inviteUrl: 'https://chat.whatsapp.com/first' } }), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { eventId: 9, inviteUrl: 'https://chat.whatsapp.com/created' } }), { headers: { 'Content-Type': 'application/json' }, status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { eventId: 9, inviteUrl: 'https://chat.whatsapp.com/updated' } }), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await fetchEventCircle(9)
    await createEventCircle(9, { inviteUrl: 'https://chat.whatsapp.com/created' })
    await updateEventCircle(9, { inviteUrl: 'https://chat.whatsapp.com/updated' })
    await deleteEventCircle(9)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/events/9/circle', expect.objectContaining({ method: 'GET' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/events/9/circle', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/events/9/circle', expect.objectContaining({ method: 'PATCH' }))
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/events/9/circle', expect.objectContaining({ method: 'DELETE' }))
  })
})
