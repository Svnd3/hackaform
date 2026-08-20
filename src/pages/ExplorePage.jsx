import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventGrid from '../components/EventGrid.jsx'
import { EmptyState, ErrorState, LoadingGrid } from '../components/StateViews.jsx'
import { EVENT_CATEGORIES } from '../data/categories.js'
import { useEventCatalog } from '../hooks/useEventCatalog.js'
import { searchAndFilterEvents } from '../utils/eventUtils.js'

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formResetKey, setFormResetKey] = useState(0)
  const { events, loading, error, retry } = useEventCatalog({ pageSize: 60 })
  const urlQuery = searchParams.get('q') ?? ''
  const urlLocation = searchParams.get('location') ?? ''

  const filters = useMemo(
    () => ({
      category: searchParams.get('category') ?? '',
      date: searchParams.get('date') ?? '',
      location: searchParams.get('location') ?? '',
      online: searchParams.get('format') ?? '',
      query: searchParams.get('q') ?? '',
      sort: searchParams.get('sort') ?? 'date-asc',
    }),
    [searchParams],
  )

  const filteredEvents = useMemo(
    () => searchAndFilterEvents(events, filters),
    [events, filters],
  )

  const activeFilters = [
    filters.query && { key: 'q', label: `“${filters.query}”` },
    filters.location && { key: 'location', label: filters.location },
    filters.category && { key: 'category', label: filters.category },
    filters.date && { key: 'date', label: dateLabels[filters.date] ?? filters.date },
    filters.online && { key: 'format', label: formatLabels[filters.online] ?? filters.online },
  ].filter(Boolean)

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  function submitSearch(query, location) {
    const next = new URLSearchParams(searchParams)
    if (query.trim()) next.set('q', query.trim())
    else next.delete('q')
    if (location.trim()) next.set('location', location.trim())
    else next.delete('location')
    setSearchParams(next)
  }

  function resetFilters() {
    setFormResetKey((key) => key + 1)
    setSearchParams({})
  }

  function removeFilter(key) {
    updateFilter(key, '')
  }

  return (
    <div className="explore-page">
      <header className="page-banner page-banner--explore">
        <div className="container">
          <p className="eyebrow">Go find your people</p>
          <div className="page-banner__title-row">
            <h1>Explore what’s happening.</h1>
            <p>Real events, fresh ideas and useful rooms—collected in one thoughtful place.</p>
          </div>

          <ExploreSearchForm
            initialLocation={urlLocation}
            initialQuery={urlQuery}
            key={`${urlQuery}:${urlLocation}:${formResetKey}`}
            onSubmit={submitSearch}
          />
        </div>
      </header>

      <div className="container explore-content">
        <div className="filter-bar">
          <div className="filter-bar__label">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>Filter by</span>
          </div>
          <label>
            <span className="sr-only">Category</span>
            <select onChange={(event) => updateFilter('category', event.target.value)} value={filters.category}>
              <option value="">All categories</option>
              {EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Date</span>
            <select onChange={(event) => updateFilter('date', event.target.value)} value={filters.date}>
              <option value="">Any date</option>
              <option value="today">Today</option>
              <option value="week">Next 7 days</option>
              <option value="weekend">This weekend</option>
              <option value="month">This month</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Event format</span>
            <select onChange={(event) => updateFilter('format', event.target.value)} value={filters.online}>
              <option value="">Any format</option>
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </label>
          {activeFilters.length > 0 && (
            <button className="filter-reset" onClick={resetFilters} type="button">Clear all</button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters" aria-label="Active filters">
            {activeFilters.map((filter) => (
              <button key={filter.key} onClick={() => removeFilter(filter.key)} type="button">
                {filter.label} <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <div className="results-heading">
          <div>
            <p className="eyebrow">The live list</p>
            <h2>{loading ? 'Gathering events…' : `${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} to explore`}</h2>
          </div>
          <label className="sort-control">
            <span>Sort</span>
            <select onChange={(event) => updateFilter('sort', event.target.value)} value={filters.sort}>
              <option value="date-asc">Soonest first</option>
              <option value="date-desc">Latest first</option>
              <option value="name-asc">Name A–Z</option>
            </select>
          </label>
        </div>

        <div aria-live="polite" className="sr-only">
          {!loading && !error ? `${filteredEvents.length} events found` : ''}
        </div>

        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <LoadingGrid count={9} />
        ) : filteredEvents.length ? (
          <EventGrid events={filteredEvents} eagerCount={3} />
        ) : (
          <EmptyState filtered onReset={resetFilters} />
        )}
      </div>
    </div>
  )
}

function ExploreSearchForm({ initialLocation, initialQuery, onSubmit }) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(query, location)
  }

  return (
    <form className="explore-search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="explore-query">Search event names and topics</label>
      <Search size={21} aria-hidden="true" />
      <input
        id="explore-query"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search event names, topics or organizers"
        type="search"
        value={query}
      />
      <label className="sr-only" htmlFor="explore-location">Location</label>
      <input
        className="explore-search__location"
        id="explore-location"
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Location"
        type="text"
        value={location}
      />
      <button className="button button--dark" type="submit">Search</button>
    </form>
  )
}

const dateLabels = {
  month: 'This month',
  today: 'Today',
  week: 'Next 7 days',
  weekend: 'This weekend',
}

const formatLabels = {
  online: 'Online',
  'in-person': 'In person',
}
