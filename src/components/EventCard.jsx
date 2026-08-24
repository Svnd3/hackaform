import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORY_COLORS } from '../data/categories.js'
import { formatEventDate } from '../utils/eventUtils.js'
import EventArtwork from './EventArtwork.jsx'
import SaveButton from './SaveButton.jsx'

function dateParts(value, timeZone) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return { day: 'TBA', month: '' }

  try {
    return {
      day: new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(date),
      month: new Intl.DateTimeFormat('en', { month: 'short', timeZone }).format(date),
    }
  } catch {
    return {
      day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date),
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
    }
  }
}

export default function EventCard({ event, featured = false, eager = false }) {
  const date = dateParts(event.startsAt, event.timezone)
  const categoryColor = CATEGORY_COLORS[event.category] ?? 'neutral'
  const formatLabel = event.format === 'hybrid' ? 'Hybrid' : event.online ? 'Online' : 'In person'

  return (
    <article className={`event-card${featured ? ' event-card--featured' : ''}`}>
      <div className="event-card__media">
        <Link to={`/events/${event.id}`} aria-label={`View ${event.name}`}>
          <EventArtwork event={event} eager={eager} />
        </Link>
        <time className="date-tile" dateTime={event.startsAt ?? undefined}>
          <strong>{date.day}</strong>
          <span>{date.month}</span>
        </time>
        <div className="event-card__save">
          <SaveButton event={event} light />
        </div>
      </div>

      <div className="event-card__body">
        <div className="event-card__eyebrow">
          <span className={`category-pill category-pill--${categoryColor}`}>
            {event.category}
          </span>
          <span>{formatLabel}</span>
        </div>
        <Link className="event-card__title" to={`/events/${event.id}`}>
          <h3>{event.name}</h3>
          <ArrowUpRight aria-hidden="true" size={20} />
        </Link>
        {featured && event.shortDescription && (
          <p className="event-card__description">{event.shortDescription}</p>
        )}
        <div className="event-card__meta">
          <p>{formatEventDate(event.startsAt, { includeYear: true, includeTime: true, timeZone: event.timezone })}</p>
          <p>
            <MapPin size={15} aria-hidden="true" />
            {event.locationLabel}
          </p>
        </div>
      </div>
    </article>
  )
}
