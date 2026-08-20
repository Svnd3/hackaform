import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import EventArtwork from './EventArtwork.jsx'

function shortDate(value, timeZone) {
  if (!value) return { day: 'Soon', month: 'Next' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: 'Soon', month: 'Next' }

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

export default function HeroPoster({ event, loading }) {
  if (loading || !event) {
    return (
      <div className="hero-poster hero-poster--placeholder" aria-hidden="true">
        <div className="hero-poster__generic-art">
          <span className="hero-poster__ring" />
          <span className="hero-poster__star">✦</span>
          <p>Good things<br />happen when<br />we show up.</p>
        </div>
        <div className="hero-poster__generic-footer">
          <span>UP NEXT</span>
          <strong>Somewhere near you</strong>
        </div>
      </div>
    )
  }

  const date = shortDate(event.startsAt, event.timezone)

  return (
    <Link className="hero-poster" to={`/events/${event.id}`}>
      <EventArtwork event={event} eager />
      <span className="hero-poster__tag">Editor’s next pick</span>
      <span className="hero-poster__date">
        <strong>{date.day}</strong>
        <small>{date.month}</small>
      </span>
      <div className="hero-poster__info">
        <span>{event.category}</span>
        <h2>{event.name}</h2>
        <p><MapPin size={15} aria-hidden="true" /> {event.locationLabel}</p>
      </div>
      <span className="hero-poster__arrow"><ArrowUpRight aria-hidden="true" /></span>
    </Link>
  )
}
