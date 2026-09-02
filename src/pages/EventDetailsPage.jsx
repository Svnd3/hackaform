import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  Share2,
  Ticket,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BookingPanel from '../components/BookingPanel.jsx'
import EventArtwork from '../components/EventArtwork.jsx'
import EventAgenda from '../components/EventAgenda.jsx'
import EventCirclePanel from '../components/EventCirclePanel.jsx'
import EventGrid from '../components/EventGrid.jsx'
import SaveButton from '../components/SaveButton.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { ErrorState, LoadingGrid } from '../components/StateViews.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useEventCatalog } from '../hooks/useEventCatalog.js'
import { useSavedEvents } from '../hooks/useSavedEvents.js'
import { fetchEventById } from '../services/eventsApi.js'
import { formatDateRange, getEventStatus } from '../utils/eventUtils.js'

function statusLabel(event) {
  if (event.status === 'draft') return 'Draft preview'
  if (event.status === 'cancelled') return 'Cancelled'
  const timing = getEventStatus(event)
  if (timing === 'ongoing') return 'Happening now'
  if (timing === 'past') return 'Event ended'
  if (timing === 'date-tba') return 'Date TBA'
  return 'Upcoming'
}

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const { authenticated, loading: authLoading } = useAuth()
  const { savedEvents } = useSavedEvents()
  const cachedEvent = savedEvents.find((event) => String(event.id) === String(eventId))
  const [result, setResult] = useState({ event: null, error: null, requestToken: null, status: 'loading' })
  const [copied, setCopied] = useState(false)
  const [requestKey, setRequestKey] = useState(0)
  const [circleRefreshKey, setCircleRefreshKey] = useState(0)
  const catalog = useEventCatalog({ pageSize: 12 })
  const requestToken = `${eventId}:${requestKey}`
  const currentResult = result.requestToken === requestToken
    ? result
    : { event: cachedEvent ?? null, error: null, status: 'loading' }
  const { event, error, status } = currentResult

  useEffect(() => {
    if (authLoading) return undefined
    const controller = new AbortController()

    fetchEventById(eventId, { auth: authenticated, signal: controller.signal })
      .then((result) => {
        setResult({ event: result, error: null, requestToken, status: 'success' })
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (cachedEvent) {
          setResult({ event: cachedEvent, error: null, requestToken, status: 'success' })
        } else {
          setResult({ event: null, error: requestError, requestToken, status: 'error' })
        }
      })

    return () => controller.abort()
  }, [authenticated, authLoading, cachedEvent, eventId, requestToken])

  useEffect(() => {
    if (event?.name) document.title = `${event.name} — Hackaform`
  }, [event?.name])

  const relatedEvents = catalog.events
    .filter((item) => String(item.id) !== String(eventId) && item.category === event?.category)
    .slice(0, 3)

  async function shareEvent() {
    const shareData = { title: event.name, text: `Have a look at ${event.name}`, url: window.location.href }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {})
      return
    }
    if (!navigator.clipboard?.writeText) return

    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // Keep the original label when clipboard access is blocked.
    }
  }

  if (status === 'loading' && !event) {
    return (
      <div className="container detail-loading">
        <div className="skeleton detail-loading__hero" />
        <LoadingGrid count={2} />
      </div>
    )
  }

  if (status === 'error' || !event) {
    return (
      <div className="container detail-error">
        <Link className="back-link" to="/events"><ArrowLeft size={17} aria-hidden="true" /> Back to events</Link>
        <ErrorState
          message={error?.status === 404 ? 'That event is no longer available, or its link has changed.' : undefined}
          onRetry={() => setRequestKey((key) => key + 1)}
        />
      </div>
    )
  }

  return (
    <article className="event-detail-page">
      <div className="container detail-breadcrumb">
        <Link className="back-link" to="/events"><ArrowLeft size={17} aria-hidden="true" /> All events</Link>
        <span>/</span>
        <span>{event.category}</span>
      </div>

      <div className="container detail-hero">
        <EventArtwork className="detail-hero__art" event={event} eager />
        <div className="detail-hero__overlay">
          <span className="category-pill category-pill--acid">{event.category}</span>
          <span className="detail-hero__status">{statusLabel(event)}</span>
        </div>
      </div>

      <div className="container detail-layout">
        <div className="detail-main">
          <p className="detail-kicker">Presented by {event.organizer}</p>
          <h1>{event.name}</h1>
          <p className="detail-lede">
            {event.shortDescription || 'A live experience worth adding to your calendar.'}
          </p>

          <div className="detail-quick-facts">
            <div><CalendarDays aria-hidden="true" /><span><small>Date</small>{formatDateRange(event.startsAt, event.endsAt, { timeZone: event.timezone })}</span></div>
            <div><MapPin aria-hidden="true" /><span><small>Location</small>{event.locationLabel}</span></div>
            <div><Ticket aria-hidden="true" /><span><small>Admission</small>{event.priceLabel}</span></div>
          </div>

          <section className="detail-copy">
            <p className="eyebrow">The details</p>
            <h2>What to expect</h2>
            <p>{event.description || 'The organizer has not added a full description yet. Check their website for the latest information.'}</p>
          </section>

          <EventAgenda items={event.agendaItems} />

          <EventCirclePanel event={event} refreshKey={circleRefreshKey} />

          <section className="detail-organizer">
            <div className="detail-organizer__avatar"><UserRound aria-hidden="true" /></div>
            <div>
              <p className="eyebrow">Your host</p>
              <h2>{event.organizer}</h2>
              <p>This event was created on Hackaform. Bookings and programme updates stay connected to the organizer’s live listing.</p>
            </div>
          </section>
        </div>

        <aside className="detail-sidebar detail-sidebar--booking" aria-label="Event booking">
          <BookingPanel event={event} onBookingChange={() => setCircleRefreshKey((key) => key + 1)} />
          <div className="detail-secondary-actions">
            <SaveButton event={event} label />
            <button className="share-button" onClick={shareEvent} type="button">
              {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
              {copied ? 'Link copied' : 'Share this event'}
            </button>
          </div>
        </aside>
      </div>

      {relatedEvents.length > 0 && (
        <section className="page-section related-section">
          <div className="container">
            <SectionHeading eyebrow="Keep looking" title="More like this." link={`/events?category=${encodeURIComponent(event.category)}`} />
            <EventGrid events={relatedEvents} />
          </div>
        </section>
      )}
    </article>
  )
}
