const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export const AUTH_TOKEN_KEY = 'hackaform:access-token'

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? null
    this.code = options.code ?? 'API_ERROR'
    this.fields = options.fields ?? {}
    this.details = options.details ?? null
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAccessToken(token) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  else window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function queryString(parameters = {}) {
  const search = new URLSearchParams()

  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })

  const result = search.toString()
  return result ? `?${result}` : ''
}

function errorDetails(payload, status) {
  const source = payload?.error ?? payload ?? {}
  const message =
    (typeof source === 'string' ? source : source.message) ||
    `The request failed with status ${status}.`

  return {
    code: typeof source === 'object' ? source.code : null,
    details: source,
    fields: typeof source === 'object' ? source.fields : null,
    message,
  }
}

export async function apiRequest(
  path,
  { auth = true, body, headers = {}, method = 'GET', signal } = {},
) {
  const token = auth ? getAccessToken() : null
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      body:
        body === undefined || body instanceof FormData
          ? body
          : JSON.stringify(body),
      headers: requestHeaders,
      method,
      signal,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError('Could not reach Hackaform. Check that the API is running and try again.', {
      code: 'NETWORK_ERROR',
      details: cause,
    })
  }

  let payload = null
  if (response.status !== 204) {
    const text = await response.text()
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        throw new ApiError('Hackaform returned an unreadable response.', {
          code: 'INVALID_RESPONSE',
          status: response.status,
        })
      }
    }
  }

  if (!response.ok) {
    const details = errorDetails(payload, response.status)
    if (response.status === 401 && token && typeof window !== 'undefined') {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('hackaform:unauthorized'))
    }
    throw new ApiError(details.message, {
      code: details.code,
      details: details.details,
      fields: details.fields,
      status: response.status,
    })
  }

  return payload
}

