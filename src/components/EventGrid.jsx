import EventCard from './EventCard.jsx'

export default function EventGrid({ events, eagerCount = 0 }) {
  return (
    <div className="event-grid">
      {events.map((event, index) => (
        <EventCard event={event} eager={index < eagerCount} key={event.id} />
      ))}
    </div>
  )
}
