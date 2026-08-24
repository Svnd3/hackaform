import { CalendarClock, Mic2 } from 'lucide-react'
import { formatEventDate } from '../utils/eventUtils.js'

export default function EventAgenda({ items = [] }) {
  if (!items.length) return null

  return (
    <section className="public-agenda" aria-labelledby="public-agenda-title">
      <div className="public-agenda__heading">
        <div><p className="eyebrow">Plan your day</p><h2 id="public-agenda-title">On the agenda.</h2></div>
        <CalendarClock aria-hidden="true" />
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <time dateTime={item.startsAt ?? undefined}>
              {item.startsAt ? formatEventDate(item.startsAt, { includeYear: false }) : 'Time TBA'}
            </time>
            <div>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              {item.speaker && <small><Mic2 size={14} aria-hidden="true" /> {item.speaker}</small>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

