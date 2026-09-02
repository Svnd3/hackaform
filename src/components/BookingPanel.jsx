import { ArrowRight, CalendarCheck2, Minus, Plus, RefreshCw, TicketCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  updateBooking,
} from '../services/bookingsApi.js'
import ConfirmAction from './ConfirmAction.jsx'
import InlineNotice from './InlineNotice.jsx'

export default function BookingPanel({ event, onBookingChange = () => {} }) {
  const { authenticated, user } = useAuth()
  const location = useLocation()
  const [booking, setBooking] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('loading')
  const [loadedKey, setLoadedKey] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [requestKey, setRequestKey] = useState(0)
  const [renderedAt] = useState(() => Date.now())

  useEffect(() => {
    if (!authenticated) return undefined

    const controller = new AbortController()
    fetchBookings({ signal: controller.signal })
      .then((bookings) => {
        const found = bookings.find((item) => String(item.eventId) === String(event.id)) ?? null
        setBooking(found)
        setQuantity(found?.quantity ?? 1)
        setNotes(found?.notes ?? '')
        setStatus('ready')
        setLoadedKey(`${user.id}:${event.id}`)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('load-error')
          setLoadedKey(`${user.id}:${event.id}`)
        }
      })

    return () => controller.abort()
  }, [authenticated, event.id, requestKey, user?.id])

  async function submitBooking(action) {
    setStatus('saving')
    setError(null)
    setNotice(null)
    try {
      const result = booking
        ? await updateBooking(booking.id, { notes: notes.trim(), quantity })
        : await createBooking({ eventId: event.id, notes: notes.trim(), quantity })
      setBooking(result)
      setEditing(false)
      setNotice(action === 'update' ? 'Your booking was updated.' : 'You have a place. See you there!')
      setStatus('ready')
      onBookingChange(result)
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  async function cancelBooking() {
    setStatus('saving')
    setError(null)
    try {
      await deleteBooking(booking.id)
      setBooking(null)
      setQuantity(1)
      setNotes('')
      setConfirming(false)
      setNotice('Your booking was cancelled.')
      setStatus('ready')
      onBookingChange(null)
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  if (String(event.ownerId) === String(user?.id)) {
    return (
      <section className="booking-panel booking-panel--owner">
        <span className="booking-panel__icon"><CalendarCheck2 aria-hidden="true" /></span>
        <p className="eyebrow">You’re the host</p>
        <h2>This one is yours.</h2>
        <p>Update details, build the agenda, and review attendance from your organizer studio.</p>
        <Link className="button button--dark button--full" to={`/organizer/events/${event.id}/edit`}>
          Manage this event <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    )
  }

  if (!authenticated) {
    return (
      <section className="booking-panel">
        <span className="booking-panel__icon"><TicketCheck aria-hidden="true" /></span>
        <p className="eyebrow">Ready when you are</p>
        <h2>Save your place.</h2>
        <p>Sign in to make a real booking and keep all your plans together.</p>
        <Link className="button button--primary button--full" state={{ from: location }} to="/login">
          Sign in to book <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link className="booking-panel__quiet-link" state={{ from: location }} to="/register">
          New here? Create an account
        </Link>
      </section>
    )
  }

  if (status === 'loading' || loadedKey !== `${user.id}:${event.id}`) {
    return (
      <section className="booking-panel booking-panel--loading" aria-live="polite">
        <div className="skeleton skeleton--eyebrow" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <span className="sr-only">Checking your booking…</span>
      </section>
    )
  }

  if (status === 'load-error') {
    return (
      <section className="booking-panel">
        <p className="eyebrow">Booking unavailable</p>
        <h2>We couldn’t check your place.</h2>
        <InlineNotice>{error?.message || 'Please try again.'}</InlineNotice>
        <button
          className="button button--dark button--full"
          onClick={() => {
            setError(null)
            setStatus('loading')
            setRequestKey((key) => key + 1)
          }}
          type="button"
        >
          <RefreshCw size={17} aria-hidden="true" /> Try again
        </button>
      </section>
    )
  }

  if (booking && !editing) {
    return (
      <section className="booking-panel booking-panel--confirmed">
        <span className="booking-panel__icon"><TicketCheck aria-hidden="true" /></span>
        <p className="eyebrow">Booking confirmed</p>
        <h2>You’re on the list.</h2>
        <p>{booking.quantity} {booking.quantity === 1 ? 'place' : 'places'} reserved under {user.name}.</p>
        {notice && <InlineNotice kind="success">{notice}</InlineNotice>}
        {error && <InlineNotice>{error.message}</InlineNotice>}
        <div className="booking-panel__actions">
          <button className="button button--dark" onClick={() => setEditing(true)} type="button">Edit booking</button>
          <Link className="button button--ghost" to="/schedule">My schedule</Link>
        </div>
        {confirming ? (
          <ConfirmAction
            busy={status === 'saving'}
            confirmLabel="Yes, cancel"
            message="Give up this place?"
            onCancel={() => setConfirming(false)}
            onConfirm={cancelBooking}
          />
        ) : (
          <button className="text-danger-button" onClick={() => setConfirming(true)} type="button">Cancel booking</button>
        )}
      </section>
    )
  }

  const currentlyHeld = booking?.status === 'confirmed' ? booking.quantity : 0
  const maximum = Math.max(
    1,
    Math.min(10, (event.availableSpots ?? 10) + currentlyHeld),
  )
  const eventEnded = event.endAt && new Date(event.endAt).getTime() < renderedAt
  const bookingClosed = !booking && eventEnded
  const soldOut = !booking && event.availableSpots === 0

  return (
    <section className="booking-panel">
      <p className="eyebrow">{booking ? 'Edit your booking' : bookingClosed ? 'Booking closed' : soldOut ? 'At capacity' : 'Book with Hackaform'}</p>
      <h2>{booking ? 'Plans changed?' : bookingClosed ? 'This event has ended.' : soldOut ? 'The room is full.' : 'Claim your spot.'}</h2>
      <p>{bookingClosed ? 'Explore upcoming events to find your next room.' : soldOut ? 'Check back later in case another attendee cancels.' : `${event.availableSpots ?? 'A limited number of'} places currently available.`}</p>
      {notice && <InlineNotice kind="success">{notice}</InlineNotice>}
      {error && <InlineNotice>{error.message}</InlineNotice>}

      {!soldOut && !bookingClosed && (
        <form onSubmit={(formEvent) => { formEvent.preventDefault(); submitBooking(booking ? 'update' : 'create') }}>
          <fieldset className="quantity-picker">
            <legend>Number of places</legend>
            <div>
              <button aria-label="Remove one place" disabled={quantity <= 1 || status === 'saving'} onClick={() => setQuantity((count) => Math.max(1, count - 1))} type="button"><Minus size={17} /></button>
              <output aria-live="polite">{quantity}</output>
              <button aria-label="Add one place" disabled={quantity >= maximum || status === 'saving'} onClick={() => setQuantity((count) => Math.min(maximum, count + 1))} type="button"><Plus size={17} /></button>
            </div>
          </fieldset>
          <label className="form-field">
            <span>Note for the organizer <small>optional</small></span>
            <textarea maxLength="500" onChange={(changeEvent) => setNotes(changeEvent.target.value)} placeholder="Accessibility needs or anything useful to know" rows="3" value={notes} />
          </label>
          <button className="button button--primary button--full" disabled={status === 'saving'} type="submit">
            {status === 'saving' ? 'Saving…' : booking ? 'Save changes' : 'Confirm booking'}
          </button>
          {booking && <button className="booking-panel__quiet-link" onClick={() => setEditing(false)} type="button">Keep my original booking</button>}
        </form>
      )}
    </section>
  )
}
