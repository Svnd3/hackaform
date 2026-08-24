import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authApi.js'
import { getAccessToken } from '../services/apiClient.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children, initialUser }) {
  const hasInitialUser = initialUser !== undefined
  const [user, setUser] = useState(initialUser ?? null)
  const [status, setStatus] = useState(
    hasInitialUser || !getAccessToken() ? 'ready' : 'loading',
  )

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      setStatus('ready')
    }

    window.addEventListener('hackaform:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('hackaform:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    if (hasInitialUser || !getAccessToken()) return undefined
    const controller = new AbortController()

    fetchCurrentUser({ signal: controller.signal })
      .then((currentUser) => setUser(currentUser))
      .catch((error) => {
        if (error.name !== 'AbortError') logoutUser()
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatus('ready')
      })

    return () => controller.abort()
  }, [hasInitialUser])

  const login = useCallback(async (credentials) => {
    const nextUser = await loginUser(credentials)
    setUser(nextUser)
    setStatus('ready')
    return nextUser
  }, [])

  const register = useCallback(async (credentials) => {
    const nextUser = await registerUser(credentials)
    setUser(nextUser)
    setStatus('ready')
    return nextUser
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
    setStatus('ready')
  }, [])

  const value = useMemo(
    () => ({
      authenticated: Boolean(user),
      loading: status === 'loading',
      login,
      logout,
      register,
      user,
    }),
    [login, logout, register, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

