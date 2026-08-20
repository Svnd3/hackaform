import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useSavedEvents } from '../hooks/useSavedEvents.js'

export default function Toast() {
  const { notice, dismissNotice } = useSavedEvents()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!notice || paused) return undefined
    const timeout = window.setTimeout(dismissNotice, 3800)
    return () => window.clearTimeout(timeout)
  }, [dismissNotice, notice, paused])

  if (!notice) return null

  return (
    <div
      className="toast"
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      role="status"
      aria-live="polite"
    >
      <span className="toast__icon">
        <Check size={16} strokeWidth={3} aria-hidden="true" />
      </span>
      <span>{notice.message}</span>
      <button onClick={dismissNotice} type="button" aria-label="Dismiss notification">
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  )
}
