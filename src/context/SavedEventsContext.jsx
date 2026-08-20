import { useCallback, useMemo, useState } from 'react'
import { SavedEventsContext } from './savedEventsContext.js'

const STORAGE_KEY = 'tukio:saved-events'
function readSavedEvents() {
  if (typeof window === 'undefined') return []

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function SavedEventsProvider({ children }) {
  const [savedEvents, setSavedEvents] = useState(readSavedEvents)
  const [notice, setNotice] = useState(null)

  const persist = useCallback((events) => {
    setSavedEvents(events)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [])

  const isSaved = useCallback(
    (eventId) => savedEvents.some((event) => String(event.id) === String(eventId)),
    [savedEvents],
  )

  const toggleSaved = useCallback(
    (event) => {
      const exists = savedEvents.some(
        (savedEvent) => String(savedEvent.id) === String(event.id),
      )
      const nextEvents = exists
        ? savedEvents.filter(
            (savedEvent) => String(savedEvent.id) !== String(event.id),
          )
        : [event, ...savedEvents]

      persist(nextEvents)
      setNotice({
        id: Date.now(),
        message: exists
          ? `${event.name} removed from your list.`
          : `${event.name} saved for later.`,
      })
    },
    [persist, savedEvents],
  )

  const clearSaved = useCallback(() => {
    persist([])
    setNotice({ id: Date.now(), message: 'Your saved list is now clear.' })
  }, [persist])

  const dismissNotice = useCallback(() => setNotice(null), [])

  const value = useMemo(
    () => ({
      savedEvents,
      savedCount: savedEvents.length,
      isSaved,
      toggleSaved,
      clearSaved,
      notice,
      dismissNotice,
    }),
    [
      clearSaved,
      dismissNotice,
      isSaved,
      notice,
      savedEvents,
      toggleSaved,
    ],
  )

  return (
    <SavedEventsContext.Provider value={value}>
      {children}
    </SavedEventsContext.Provider>
  )
}
