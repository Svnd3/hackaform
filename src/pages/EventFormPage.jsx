import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import AgendaManager from '../components/AgendaManager.jsx'
import EventForm from '../components/EventForm.jsx'
import InlineNotice from '../components/InlineNotice.jsx'
import { ErrorState } from '../components/StateViews.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { createEvent, fetchEventById, updateEvent } from '../services/eventsApi.js'

export default function EventFormPage() {
  const { eventId } = useParams()
  const editing = Boolean(eventId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState(editing ? 'loading' : 'ready')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(
    location.state?.created ? 'Event created. Now give the day an agenda.' : null,
  )
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!editing) return undefined
    const controller = new AbortController()
    fetchEventById(eventId, { signal: controller.signal })
      .then((result) => {
        setEvent(result)
        setStatus('ready')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [editing, eventId, requestKey])

  async function save(values) {
    setStatus('saving')
    setError(null)
    setNotice(null)
    try {
      if (editing) {
        const updated = await updateEvent(eventId, values)
        setEvent(updated)
        setNotice('Your event changes are live.')
        setStatus('ready')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const created = await createEvent(values)
        setEvent(created)
        setNotice('Event created. Now give the day an agenda.')
        setStatus('ready')
        navigate(`/organizer/events/${created.id}/edit`, { replace: true, state: { created: true } })
      }
    } catch (requestError) {
      setError(requestError)
      setStatus('ready')
    }
  }

  if (status === 'loading') {
    return <div className="route-loading" role="status"><span className="route-loading__mark">H</span><strong>Opening your event draft…</strong></div>
  }

  if (status === 'error' && !event) {
    return <div className="container detail-error"><Link className="back-link" to="/organizer"><ArrowLeft size={17} /> Organizer studio</Link><ErrorState message={error?.message} onRetry={() => { setStatus('loading'); setError(null); setRequestKey((key) => key + 1) }} /></div>
  }

  if (editing && event && String(event.ownerId) !== String(user.id)) {
    return <Navigate replace to="/organizer" />
  }

  return (
    <div className="event-form-page">
      <header className="event-form-hero">
        <div className="container">
          <Link className="back-link" to="/organizer"><ArrowLeft size={17} /> Organizer studio</Link>
          <p className="eyebrow">{editing ? 'Edit the experience' : 'New event'}</p>
          <h1>{editing ? 'Make every detail earn its place.' : 'Start with a reason to gather.'}</h1>
          <p>{editing ? 'Keep the listing accurate, then shape the programme below.' : 'A clear event page is the first promise you make to your attendees.'}</p>
        </div>
      </header>
      <div className="container event-form-wrap">
        {notice && <InlineNotice kind="success">{notice}</InlineNotice>}
        <EventForm error={error} event={event} key={event?.id ?? 'new'} onSubmit={save} submitting={status === 'saving'} />
        {editing && <AgendaManager eventId={eventId} timezone={event?.timezone} />}
      </div>
    </div>
  )
}
