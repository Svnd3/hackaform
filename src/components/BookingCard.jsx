import { CalendarDays, MapPin, Pencil, TicketCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteBooking, updateBooking } from '../services/bookingsApi.js'
import { formatEventDate } from '../utils/eventUtils.js'
import ConfirmAction from './ConfirmAction.jsx'
import EventArtwork from './EventArtwork.jsx'
import InlineNotice from './InlineNotice.jsx'

export default function BookingCard({ booking, onChange, onRemove }) {
  const event = booking.event
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [quantity, setQuantity] = useState(booking.quantity)
  const [notes, setNotes] = useState(booking.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(eventObject) {
    eventObject.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const updated = await updateBooking(booking.id, { notes: notes.trim(), quantity })
      onChange({ ...updated, event: updated.event ?? event })
      setEditing(false)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await deleteBooking(booking.id)
      onRemove(booking.id)
    } catch (requestError) {
      setError(requestError)
      setBusy(false)
      setConfirming(false)
    }
  }

  if (!event) return null

  const maximum = Math.max(
    1,
    Math.min(
      10,
      (event.availableSpots ?? 10) +
        (booking.status === 'confirmed' ? booking.quantity : 0),
    ),
  )

  return (
    <article className="booking-card">
      <EventArtwork className="booking-card__art" event={event} />
      <div className="booking-card__body">
        <div className="booking-card__topline">
          <span><TicketCheck size={16} aria-hidden="true" /> {booking.status}</span>
          <span>{booking.quantity} {booking.quantity === 1 ? 'place' : 'places'}</span>
        </div>
        {event.status === 'published' ? (
          <Link to={`/events/${event.id}`}><h2>{event.name}</h2></Link>
        ) : (
          <h2>{event.name}</h2>
        )}
        <div className="booking-card__facts">
          <span><CalendarDays size={16} /> {formatEventDate(event.startsAt, { timeZone: event.timezone })}</span>
          <span><MapPin size={16} /> {event.locationLabel}</span>
        </div>
        {event.status !== 'published' && (
          <InlineNotice kind="info">This event is currently {event.status}. Its saved booking details remain in your schedule.</InlineNotice>
        )}

        {error && <InlineNotice>{error.message}</InlineNotice>}

        {editing ? (
          <form className="booking-edit-form" onSubmit={save}>
            <label>Places<input max={maximum} min="1" onChange={(changeEvent) => setQuantity(Number(changeEvent.target.value))} required type="number" value={quantity} /></label>
            <label>Note<textarea maxLength="500" onChange={(changeEvent) => setNotes(changeEvent.target.value)} rows="2" value={notes} /></label>
            <div><button className="button button--dark" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button><button className="button button--ghost" disabled={busy} onClick={() => setEditing(false)} type="button">Cancel edit</button></div>
          </form>
        ) : (
          <>
            {booking.notes && <blockquote>“{booking.notes}”</blockquote>}
            <div className="booking-card__actions">
              <button onClick={() => setEditing(true)} type="button"><Pencil size={15} /> Edit</button>
              <button className="booking-card__cancel" onClick={() => setConfirming(true)} type="button"><Trash2 size={15} /> Cancel booking</button>
            </div>
          </>
        )}

        {confirming && (
          <ConfirmAction busy={busy} confirmLabel="Cancel booking" message={`Cancel your place at ${event.name}?`} onCancel={() => setConfirming(false)} onConfirm={remove} />
        )}
      </div>
    </article>
  )
}
