import { ArrowRight, CalendarCheck2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingCard from '../components/BookingCard.jsx'
import InlineNotice from '../components/InlineNotice.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { fetchBookings } from '../services/bookingsApi.js'

export default function SchedulePage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [requestKey, setRequestKey] = useState(0)

  const load = useCallback(() => {
    setStatus('loading')
    setError(null)
    setRequestKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchBookings({ signal: controller.signal })
      .then((items) => {
        setBookings(items)
        setStatus('ready')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [requestKey])

  const upcoming = useMemo(
    () => [...bookings].sort((left, right) => new Date(left.event?.startsAt ?? 0) - new Date(right.event?.startsAt ?? 0)),
    [bookings],
  )
  const activeCount = bookings.filter((booking) => booking.status === 'confirmed').length

  return (
    <div className="schedule-page">
      <header className="workspace-hero workspace-hero--schedule">
        <div className="container workspace-hero__grid">
          <div>
            <p className="eyebrow">{user.name}’s event plan</p>
            <h1>Your good reasons to leave the house.</h1>
            <p>Every booking, date, and detail in one dependable place.</p>
          </div>
          <div className="workspace-counter" aria-label={`${activeCount} active bookings`}>
            <CalendarCheck2 aria-hidden="true" />
            <strong>{activeCount.toString().padStart(2, '0')}</strong>
            <span>plans on deck</span>
          </div>
        </div>
      </header>

      <section className="container workspace-content">
        <div className="workspace-heading">
          <div><p className="eyebrow">My schedule</p><h2>What’s coming up.</h2></div>
          <Link className="button button--dark" to="/events">Find another event <ArrowRight size={17} /></Link>
        </div>

        {status === 'loading' ? (
          <div className="workspace-loading" aria-label="Loading bookings">
            <div className="skeleton" /><div className="skeleton" />
          </div>
        ) : status === 'error' ? (
          <div className="workspace-error">
            <InlineNotice>{error.message}</InlineNotice>
            <button className="button button--dark" onClick={load} type="button"><RefreshCw size={17} /> Try again</button>
          </div>
        ) : upcoming.length ? (
          <div className="booking-list">
            {upcoming.map((booking) => (
              <BookingCard
                booking={booking}
                key={booking.id}
                onChange={(updated) => setBookings((items) => items.map((item) => item.id === updated.id ? updated : item))}
                onRemove={(id) => setBookings((items) => items.filter((item) => item.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="workspace-empty">
            <span><CalendarCheck2 size={34} aria-hidden="true" /></span>
            <p className="eyebrow">Fresh page</p>
            <h2>No bookings yet.</h2>
            <p>Explore what’s happening and claim a place when something feels right.</p>
            <Link className="button button--primary" to="/events">Explore events <ArrowRight size={17} /></Link>
          </div>
        )}
      </section>
    </div>
  )
}
