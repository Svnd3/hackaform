import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './apiClient.js'

function authSession(payload) {
  const data = payload?.data ?? payload ?? {}
  const accessToken = data.accessToken ?? data.access_token ?? data.token
  const user = data.user

  if (!accessToken || !user) {
    throw new Error('The authentication response was incomplete.')
  }

  return { accessToken, user }
}

export async function registerUser(credentials, options = {}) {
  const session = authSession(
    await apiRequest('/auth/register', {
      auth: false,
      body: credentials,
      method: 'POST',
      signal: options.signal,
    }),
  )
  setAccessToken(session.accessToken)
  return session.user
}

export async function loginUser(credentials, options = {}) {
  const session = authSession(
    await apiRequest('/auth/login', {
      auth: false,
      body: credentials,
      method: 'POST',
      signal: options.signal,
    }),
  )
  setAccessToken(session.accessToken)
  return session.user
}

export async function fetchCurrentUser(options = {}) {
  if (!getAccessToken()) return null
  const payload = await apiRequest('/auth/me', { signal: options.signal })
  return payload?.data ?? payload ?? null
}

export function logoutUser() {
  clearAccessToken()
}

