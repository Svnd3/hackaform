import { ArrowRight, CalendarPlus, Eye, Pencil, RefreshCw, Trash2, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AttendeeRoster from '../components/AttendeeRoster.jsx'
import ConfirmAction from '../components/ConfirmAction.jsx'
import EventArtwork from '../components/EventArtwork.jsx'
import InlineNotice from '../components/InlineNotice.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { deleteEvent, fetchEvents } from '../services/eventsApi.js'
import { formatEventDate } from '../utils/eventUtils.js'

export default function OrganizerDashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [requestKey, setRequestKey] = useState(0)
  const [confirming, setConfirming] = useState(null)
  const [rosterEvent, setRosterEvent] = useState(null)

  const retry = useCallback(() => {
    setStatus('loading')
    setError(null)
    setRequestKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchEvents({ mine: true, pageSize: 100, signal: controller.signal })
      .then(({ events: result }) => {
        setEvents(result)
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

  async function removeEvent(eventId) {
    setStatus('deleting')
    setError(null)
    try {
      await deleteEvent(eventId)
      setEvents((items) => items.filter((item) => item.id !== eventId))
      setConfirming(null)
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
      setConfirming(null)
    }
  }

  const totalBookings = events.reduce((total, event) => total + (event.bookedSpots ?? 0), 0)
  const published = events.filter((event) => event.status === 'published').length

  return (
    <div className="organizer-page">
      <header className="workspace-hero workspace-hero--organizer">
        <div className="container workspace-hero__grid">
          <div><p className="eyebrow">Organizer studio · {user.name}</p><h1>Make a room worth entering.</h1><p>Create the event, shape the agenda, and know who is showing up.</p></div>
          <Link className="button button--acid button--large" to="/organizer/events/new"><CalendarPlus size={19} /> Create an event</Link>
        </div>
      </header>

      <section className="container organizer-content">
        <div className="organizer-stats" aria-label="Organizer summary">
          <div><span>Events</span><strong>{events.length.toString().padStart(2, '0')}</strong></div>
          <div><span>Published</span><strong>{published.toString().padStart(2, '0')}</strong></div>
          <div><span>Booked places</span><strong>{totalBookings.toString().padStart(2, '0')}</strong></div>
        </div>

        <div className="workspace-heading">
          <div><p className="eyebrow">Your programme</p><h2>Events you run.</h2></div>
          <Link className="button button--dark" to="/organizer/events/new">New event <ArrowRight size={17} /></Link>
        </div>

        {error && <InlineNotice>{error.message}</InlineNotice>}
        {status === 'loading' ? (
          <div className="workspace-loading" aria-label="Loading organizer events"><div className="skeleton" /><div className="skeleton" /></div>
        ) : status === 'error' && !events.length ? (
          <button className="button button--dark" onClick={retry} type="button"><RefreshCw size={17} /> Try again</button>
        ) : events.length ? (
          <div className="organizer-event-list">
            {events.map((event) => (
              <article className="organizer-event" key={event.id}>
                <EventArtwork className="organizer-event__art" event={event} />
                <div className="organizer-event__main">
                  <div className="organizer-event__meta"><span className={`status-pill status-pill--${event.status}`}>{event.status}</span><span>{event.category}</span></div>
                  <h3>{event.name}</h3>
                  <p>{formatEventDate(event.startsAt, { timeZone: event.timezone })} · {event.locationLabel}</p>
                  <div className="organizer-event__capacity"><span><i style={{ width: `${Math.min(100, ((event.bookedSpots ?? 0) / Math.max(1, event.capacity ?? 1)) * 100)}%` }} /></span><small>{event.bookedSpots ?? 0} of {event.capacity ?? '—'} places booked</small></div>
                </div>
                <div className="organizer-event__actions">
                  <Link aria-label={`View ${event.name}`} to={`/events/${event.id}`}><Eye size={17} /> View</Link>
                  <button onClick={() => setRosterEvent(event)} type="button"><UsersRound size={17} /> Attendees</button>
                  <Link to={`/organizer/events/${event.id}/edit`}><Pencil size={17} /> Edit & agenda</Link>
                  <button className="danger-link" onClick={() => setConfirming(event.id)} type="button"><Trash2 size={17} /> Delete</button>
                </div>
                {confirming === event.id && <ConfirmAction busy={status === 'deleting'} confirmLabel="Delete event" message={`Permanently delete “${event.name}” and its agenda?`} onCancel={() => setConfirming(null)} onConfirm={() => removeEvent(event.id)} />}
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty"><span><CalendarPlus size={34} /></span><p className="eyebrow">Blank canvas</p><h2>Your first event starts here.</h2><p>Turn a meetup, workshop, or hackathon idea into something people can book.</p><Link className="button button--primary" to="/organizer/events/new">Create an event <ArrowRight size={17} /></Link></div>
        )}
      </section>

      {rosterEvent && <div className="roster-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRosterEvent(null) }}><AttendeeRoster event={rosterEvent} onClose={() => setRosterEvent(null)} /></div>}
    </div>
  )
}
