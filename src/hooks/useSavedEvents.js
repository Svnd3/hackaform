import { useContext } from 'react'
import { SavedEventsContext } from '../context/savedEventsContext.js'

export function useSavedEvents() {
  const context = useContext(SavedEventsContext)

  if (!context) {
    throw new Error('useSavedEvents must be used inside SavedEventsProvider')
  }

  return context
}
