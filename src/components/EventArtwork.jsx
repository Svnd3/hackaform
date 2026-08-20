import { useState } from 'react'
import { Sparkles } from 'lucide-react'

function toneFor(id = '') {
  const tones = ['orange', 'violet', 'sky', 'acid', 'pink', 'green']
  const sum = String(id)
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  return tones[sum % tones.length]
}

export default function EventArtwork({ event, eager = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const source = event.imageUrl ?? event.thumbnailUrl

  return (
    <div className={`event-artwork event-artwork--${toneFor(event.id)} ${className}`}>
      {source && !failed ? (
        <img
          alt={`${event.name} event artwork`}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          src={source}
        />
      ) : (
        <div className="event-artwork__fallback" aria-label={`${event.name} graphic`} role="img">
          <span className="event-artwork__orb" />
          <Sparkles aria-hidden="true" />
          <strong>{event.category}</strong>
          <small>Make a day of it</small>
        </div>
      )}
      <span className="event-artwork__noise" aria-hidden="true" />
    </div>
  )
}
