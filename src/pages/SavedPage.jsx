import { Bookmark, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import EventGrid from '../components/EventGrid.jsx'
import { EmptyState } from '../components/StateViews.jsx'
import { useSavedEvents } from '../hooks/useSavedEvents.js'

export default function SavedPage() {
  const { savedEvents, savedCount, clearSaved } = useSavedEvents()
  const [confirming, setConfirming] = useState(false)
  const clearButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (confirming) confirmButtonRef.current?.focus()
  }, [confirming])

  function confirmClear() {
    clearSaved()
    setConfirming(false)
  }

  function cancelClear() {
    setConfirming(false)
    window.requestAnimationFrame(() => clearButtonRef.current?.focus())
  }

  return (
    <div className="saved-page">
      <header className="page-banner page-banner--saved">
        <div className="container saved-header">
          <div>
            <p className="eyebrow">Your shortlist</p>
            <h1>Keep the good ones close.</h1>
            <p>Events saved here stay on this device, ready whenever your calendar is.</p>
          </div>
          <div className="saved-header__stamp" aria-hidden="true">
            <Bookmark fill="currentColor" />
            <strong>{savedCount}</strong>
            <span>saved</span>
          </div>
        </div>
      </header>

      <section className="container saved-content">
        {savedCount > 0 && (
          <div className="saved-toolbar">
            <p><strong>{savedCount}</strong> event{savedCount === 1 ? '' : 's'} waiting for you</p>
            {confirming ? (
              <div className="clear-confirm" role="group" aria-label="Confirm clear saved events">
                <span>Remove everything?</span>
                <button onClick={confirmClear} ref={confirmButtonRef} type="button">Yes, clear</button>
                <button aria-label="Cancel" onClick={cancelClear} type="button"><X size={16} /></button>
              </div>
            ) : (
              <button className="clear-saved" onClick={() => setConfirming(true)} ref={clearButtonRef} type="button">
                <Trash2 size={16} aria-hidden="true" /> Clear saved
              </button>
            )}
          </div>
        )}

        {savedCount ? <EventGrid events={savedEvents} /> : <EmptyState />}
      </section>
    </div>
  )
}
