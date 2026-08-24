import { RefreshCw, UsersRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchEventBookings } from '../services/bookingsApi.js'
import InlineNotice from './InlineNotice.jsx'

function attendeeName(booking) {
  return booking.user?.name || booking.attendee?.name || booking.attendeeName || 'Hackaform attendee'
}

export default function AttendeeRoster({ event, onClose }) {
  const closeButtonRef = useRef(null)
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    const returnFocusTo = document.activeElement
    closeButtonRef.current?.focus()

    function closeOnEscape(keyEvent) {
      if (keyEvent.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      returnFocusTo?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    const controller = new AbortController()
    fetchEventBookings(event.id, { signal: controller.signal })
      .then(({ bookings: result }) => {
        setBookings(result)
        setStatus('ready')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [event.id, requestKey])

  const activeBookings = bookings.filter((booking) => booking.status === 'confirmed')
  const places = activeBookings.reduce((total, booking) => total + booking.quantity, 0)

  return (
    <aside className="roster-panel" aria-labelledby="roster-title" aria-modal="true" role="dialog">
      <div className="roster-panel__top">
        <div><p className="eyebrow">Attendance</p><h2 id="roster-title">{event.name}</h2></div>
        <button aria-label="Close attendee list" onClick={onClose} ref={closeButtonRef} type="button"><X /></button>
      </div>
      {status === 'loading' ? (
        <p role="status">Gathering the guest list…</p>
      ) : status === 'error' ? (
        <><InlineNotice>{error.message}</InlineNotice><button className="button button--dark" onClick={() => { setStatus('loading'); setError(null); setRequestKey((key) => key + 1) }} type="button"><RefreshCw size={16} /> Try again</button></>
      ) : bookings.length ? (
        <>
          <div className="roster-summary"><UsersRound aria-hidden="true" /><strong>{places}</strong><span>confirmed places across {activeBookings.length} active bookings</span></div>
          <ul className="roster-list">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <span>{attendeeName(booking).slice(0, 1).toUpperCase()}</span>
                <div><strong>{attendeeName(booking)}</strong><small>{booking.quantity} {booking.quantity === 1 ? 'place' : 'places'} · {booking.status}</small></div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="roster-empty"><UsersRound size={30} /><h3>No bookings yet.</h3><p>Share your event page and the guest list will grow here.</p></div>
      )}
    </aside>
  )
}
