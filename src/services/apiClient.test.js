import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_TOKEN_KEY,
  ApiError,
  apiRequest,
  queryString,
} from './apiClient.js'

describe('apiClient', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('adds a stored JWT as a Bearer token', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'signed-token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 1 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    await apiRequest('/auth/me')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer signed-token' }) }),
    )
  })

  it('turns structured API failures into useful ApiError objects', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', fields: { title: 'Required' }, message: 'Check the form.' } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 422,
      }),
    )

    await expect(apiRequest('/events', { body: {}, method: 'POST' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { title: 'Required' },
      message: 'Check the form.',
      status: 422,
    })
    expect(new ApiError('Example')).toBeInstanceOf(ApiError)
  })

  it('omits blank query parameters', () => {
    expect(queryString({ category: '', mine: true, page: 2 })).toBe('?mine=true&page=2')
  })
})

