import { CalendarDays, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchPanel({ compact = false, initialValues = {} }) {
  const [query, setQuery] = useState(initialValues.query ?? '')
  const [location, setLocation] = useState(initialValues.location ?? '')
  const [date, setDate] = useState(initialValues.date ?? '')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const parameters = new URLSearchParams()
    if (query.trim()) parameters.set('q', query.trim())
    if (location.trim()) parameters.set('location', location.trim())
    if (date) parameters.set('date', date)
    const search = parameters.toString()
    navigate(`/events${search ? `?${search}` : ''}`)
  }

  return (
    <form className={`search-panel${compact ? ' search-panel--compact' : ''}`} onSubmit={handleSubmit}>
      <div className="search-field search-field--query">
        <label htmlFor={compact ? 'compact-search-query' : 'home-search-query'}>What</label>
        <div>
          <Search size={19} aria-hidden="true" />
          <input
            id={compact ? 'compact-search-query' : 'home-search-query'}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try design, data, music…"
            type="search"
            value={query}
          />
        </div>
      </div>
      <div className="search-field">
        <label htmlFor={compact ? 'compact-search-location' : 'home-search-location'}>Where</label>
        <div>
          <MapPin size={19} aria-hidden="true" />
          <input
            id={compact ? 'compact-search-location' : 'home-search-location'}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Nairobi, Mombasa or online"
            type="text"
            value={location}
          />
        </div>
      </div>
      <div className="search-field search-field--date">
        <label htmlFor={compact ? 'compact-search-date' : 'home-search-date'}>When</label>
        <div>
          <CalendarDays size={19} aria-hidden="true" />
          <select
            id={compact ? 'compact-search-date' : 'home-search-date'}
            onChange={(event) => setDate(event.target.value)}
            value={date}
          >
            <option value="">Any date</option>
            <option value="today">Today</option>
            <option value="week">Next 7 days</option>
            <option value="weekend">This weekend</option>
            <option value="month">This month</option>
          </select>
        </div>
      </div>
      <button className="button button--primary search-panel__button" type="submit">
        <Search size={19} aria-hidden="true" />
        Search events
      </button>
    </form>
  )
}
