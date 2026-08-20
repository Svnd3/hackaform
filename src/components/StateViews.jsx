import { CalendarX2, RefreshCw, SearchX, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LoadingGrid({ count = 6 }) {
  return (
    <div className="event-grid" aria-label="Loading events" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div className="event-skeleton" key={index} aria-hidden="true">
          <div className="skeleton skeleton--image" />
          <div className="event-skeleton__body">
            <div className="skeleton skeleton--eyebrow" />
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--title-short" />
            <div className="skeleton skeleton--line" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading events…</span>
    </div>
  )
}

export function ErrorState({ onRetry, compact = false, message }) {
  return (
    <div className={`state-card state-card--error${compact ? ' state-card--compact' : ''}`} role="alert">
      <div className="state-card__icon">
        <WifiOff size={27} aria-hidden="true" />
      </div>
      <p className="eyebrow">Connection hiccup</p>
      <h2>The events wandered off.</h2>
      <p>
        {message ?? 'We could not reach the live event service. Check your connection and try once more.'}
      </p>
      {onRetry && (
        <button className="button button--dark" onClick={onRetry} type="button">
          <RefreshCw size={17} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ filtered = false, onReset }) {
  return (
    <div className="state-card state-card--empty">
      <div className="state-card__icon">
        {filtered ? <SearchX size={28} aria-hidden="true" /> : <CalendarX2 size={28} aria-hidden="true" />}
      </div>
      <p className="eyebrow">{filtered ? 'No exact matches' : 'Nothing here yet'}</p>
      <h2>{filtered ? 'Try widening the search.' : 'Your calendar has room.'}</h2>
      <p>
        {filtered
          ? 'Change a keyword, location or filter and you might find the right fit.'
          : 'Explore upcoming events and save the ones you do not want to miss.'}
      </p>
      {onReset ? (
        <button className="button button--dark" onClick={onReset} type="button">
          Clear all filters
        </button>
      ) : (
        <Link className="button button--primary" to="/events">
          Explore events
        </Link>
      )}
    </div>
  )
}
