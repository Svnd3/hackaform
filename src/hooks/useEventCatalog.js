import { useCallback, useEffect, useState } from 'react'
import { fetchUpcomingEvents } from '../services/eventsApi.js'

export function useEventCatalog(options = {}) {
  const { pageSize = 36 } = options
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [requestKey, setRequestKey] = useState(0)

  const retry = useCallback(() => setRequestKey((key) => key + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvents() {
      setStatus('loading')
      setError(null)

      try {
        const result = await fetchUpcomingEvents({
          pageSize,
          signal: controller.signal,
        })
        setEvents(result)
        setStatus('success')
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('error')
        }
      }
    }

    loadEvents()
    return () => controller.abort()
  }, [pageSize, requestKey])

  return {
    events,
    loading: status === 'loading',
    error,
    retry,
  }
}
