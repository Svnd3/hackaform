import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  MapPin,
  Share2,
  Ticket,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EventArtwork from '../components/EventArtwork.jsx'
import EventGrid from '../components/EventGrid.jsx'
import SaveButton from '../components/SaveButton.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { ErrorState, LoadingGrid } from '../components/StateViews.jsx'
import { useEventCatalog } from '../hooks/useEventCatalog.js'
import { useSavedEvents } from '../hooks/useSavedEvents.js'
import { fetchEventById } from '../services/eventsApi.js'
import { formatDateRange } from '../utils/eventUtils.js'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const { savedEvents } = useSavedEvents()
  const cachedEvent = savedEvents.find((event) => String(event.id) === String(eventId))
  const [result, setResult] = useState({ event: null, error: null, requestToken: null, status: 'loading' })
  const [copied, setCopied] = useState(false)
  const [requestKey, setRequestKey] = useState(0)
  const catalog = useEventCatalog({ pageSize: 12 })
  const requestToken = `${eventId}:${requestKey}`
  const currentResult = result.requestToken === requestToken
    ? result
    : { event: cachedEvent ?? null, error: null, status: 'loading' }
  const { event, error, status } = currentResult

  useEffect(() => {
    const controller = new AbortController()

    fetchEventById(eventId, { signal: controller.signal })
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
  }, [cachedEvent, eventId, requestToken])

  useEffect(() => {
    if (event?.name) document.title = `${event.name} — Tukio`
  }, [event?.name])

  const relatedEvents = catalog.events
    .filter((item) => item.id !== eventId && item.category === event?.category)
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

  const registrationUrl = event.ticketUrl ?? event.externalUrl ?? event.detailsUrl

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
          <span className="detail-hero__status">{event.status === 'ongoing' ? 'Happening now' : 'Upcoming'}</span>
        </div>
      </div>

      <div className="container detail-layout">
        <div className="detail-main">
          <p className="detail-kicker">Presented by {event.organizer}</p>
          <h1>{event.name}</h1>
          <p className="detail-lede">
            {event.shortDescription || 'A live experience worth adding to your calendar.'}
          </p>

          {registrationUrl ? (
            <a className="button button--primary button--full detail-mobile-action" href={registrationUrl} rel="noreferrer" target="_blank">
              View official event <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ) : (
            <span className="button button--disabled button--full detail-mobile-action">Registration coming soon</span>
          )}

          <div className="detail-quick-facts">
            <div><CalendarDays aria-hidden="true" /><span><small>Date</small>{formatDateRange(event.startsAt, event.endsAt, { timeZone: event.timezone })}</span></div>
            <div><MapPin aria-hidden="true" /><span><small>Location</small>{event.locationLabel}</span></div>
            <div><Ticket aria-hidden="true" /><span><small>Admission</small>{event.priceLabel}</span></div>
          </div>

          <section className="detail-copy">
            <p className="eyebrow">The details</p>
            <h2>What to expect</h2>
            <p>{event.description || 'The organizer has not added a full description yet. Follow the official event link for the newest information.'}</p>
          </section>

          <section className="detail-organizer">
            <div className="detail-organizer__avatar"><UserRound aria-hidden="true" /></div>
            <div>
              <p className="eyebrow">Your host</p>
              <h2>{event.organizer}</h2>
              <p>Event details and registration are managed by the organizer on the official event page.</p>
            </div>
          </section>
        </div>

        <aside className="detail-sidebar" aria-label="Event booking information">
          <p className="eyebrow">Good to know</p>
          <h2>Ready to be there?</h2>
          <div className="sidebar-fact">
            <CalendarDays size={19} aria-hidden="true" />
            <span><small>Starts</small>{formatDateRange(event.startsAt, event.endsAt, { timeZone: event.timezone })}</span>
          </div>
          <div className="sidebar-fact">
            <Clock3 size={19} aria-hidden="true" />
            <span><small>Timezone</small>{event.timezone || 'Local event time'}</span>
          </div>
          <div className="sidebar-fact">
            <MapPin size={19} aria-hidden="true" />
            <span><small>Place</small>{event.locationLabel}</span>
          </div>

          {registrationUrl ? (
            <a className="button button--primary button--full" href={registrationUrl} rel="noreferrer" target="_blank">
              View official event <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ) : (
            <span className="button button--disabled button--full">Registration coming soon</span>
          )}
          <SaveButton event={event} label />
          <button className="share-button" onClick={shareEvent} type="button">
            {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
            {copied ? 'Link copied' : 'Share this event'}
          </button>
          <p className="sidebar-note"><ExternalLink size={14} aria-hidden="true" /> Registration opens on the organizer’s website.</p>
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
