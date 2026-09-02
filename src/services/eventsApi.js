import {
  formatDateRange,
  formatLocation,
  formatPrice,
  getEventStatus,
  inferCategory,
  normalizeWhitespace,
  stripHtml,
  truncateText,
} from '../utils/eventUtils.js'
import { apiRequest, queryString } from './apiClient.js'

function value(source, ...names) {
  for (const name of names) {
    if (source?.[name] !== undefined && source[name] !== null) return source[name]
  }
  return null
}

function asNumber(input) {
  if (input === null || input === undefined || input === '') return null
  const result = Number(input)
  return Number.isFinite(result) ? result : null
}

function asBoolean(input) {
  if (typeof input === 'boolean') return input
  if (typeof input === 'string') return input.toLowerCase() === 'true'
  return Boolean(input)
}

function normalizedAgendaItem(item) {
  if (!item || typeof item !== 'object') return null
  return {
    id: item.id,
    eventId: value(item, 'eventId', 'event_id'),
    title: normalizeWhitespace(item.title) || 'Untitled agenda item',
    description: stripHtml(item.description),
    speaker: normalizeWhitespace(item.speaker),
    startsAt: value(item, 'startsAt', 'startAt', 'starts_at', 'start_at'),
    endsAt: value(item, 'endsAt', 'endAt', 'ends_at', 'end_at'),
    position: asNumber(item.position) ?? 0,
    createdAt: value(item, 'createdAt', 'created_at'),
    updatedAt: value(item, 'updatedAt', 'updated_at'),
  }
}

/**
 * Keeps the Flask representation compatible with the established Phase 1 UI.
 * Snake-case fallbacks make staggered frontend/backend deployments safer.
 */
export function normalizeEvent(resource) {
  if (!resource || typeof resource !== 'object') return null

  const id = resource.id
  if (id === undefined || id === null) return null

  const name = normalizeWhitespace(value(resource, 'title', 'name')) || 'Untitled event'
  const description = stripHtml(resource.description)
  const startAt = value(resource, 'startAt', 'startsAt', 'start_at', 'starts_at')
  const endAt = value(resource, 'endAt', 'endsAt', 'end_at', 'ends_at')
  const apiFormat = normalizeWhitespace(resource.format).toLowerCase()
  const format = apiFormat === 'in_person' ? 'in-person' : apiFormat
  const online =
    resource.online !== undefined
      ? asBoolean(resource.online)
      : ['online', 'virtual'].includes(format)
  const city = normalizeWhitespace(resource.city)
  const venue = normalizeWhitespace(resource.venue)
  const locationName = online
    ? 'Online'
    : normalizeWhitespace(value(resource, 'locationName', 'location_name')) ||
      [venue, city].filter(Boolean).join(', ')
  const organizerValue = resource.organizer
  const organizer =
    normalizeWhitespace(
      typeof organizerValue === 'object'
        ? value(organizerValue, 'name', 'displayName', 'username')
        : organizerValue,
    ) || 'Community organizer'
  const price = asNumber(resource.price)
  const capacity = asNumber(resource.capacity)
  const bookedSpots = asNumber(value(resource, 'bookedSpots', 'booked_spots')) ?? 0
  const availableSpots =
    asNumber(value(resource, 'availableSpots', 'available_spots')) ??
    (capacity === null ? null : Math.max(0, capacity - bookedSpots))
  const category = normalizeWhitespace(resource.category) || inferCategory({ name, description })
  const timezone = normalizeWhitespace(resource.timezone) || 'Africa/Nairobi'
  const status = normalizeWhitespace(resource.status).toLowerCase() ||
    getEventStatus({ startsAt: startAt, endsAt: endAt })
  const agendaItems = (Array.isArray(value(resource, 'agendaItems', 'agenda_items'))
    ? value(resource, 'agendaItems', 'agenda_items')
    : [])
    .map(normalizedAgendaItem)
    .filter(Boolean)
    .sort((left, right) => left.position - right.position)

  const event = {
    ...resource,
    agendaItems,
    availableSpots,
    bookedSpots,
    capacity,
    category,
    city,
    currency: normalizeWhitespace(resource.currency).toUpperCase() || 'KES',
    description,
    endAt,
    endsAt: endAt,
    format: format || (online ? 'online' : 'in-person'),
    hasCircle: asBoolean(value(resource, 'hasCircle', 'has_circle')),
    id,
    imageUrl: value(resource, 'imageUrl', 'image_url'),
    isFree: resource.isFree ?? price === 0,
    location: { name: locationName, online, shortName: locationName },
    locationName,
    name,
    online,
    organizer,
    ownerId: value(resource, 'ownerId', 'organizerId', 'owner_id', 'organizer_id'),
    price,
    shortDescription:
      stripHtml(value(resource, 'shortDescription', 'short_description')) ||
      truncateText(description, 180),
    startAt,
    startsAt: startAt,
    status,
    timezone,
    title: name,
    venue,
  }

  event.dateLabel = formatDateRange(startAt, endAt, { timeZone: timezone })
  event.locationLabel = formatLocation(event)
  event.priceLabel = formatPrice(event, event.currency)
  return event
}

function unwrap(payload) {
  return payload?.data ?? payload
}

function normalizeCollection(payload) {
  const data = unwrap(payload)
  return (Array.isArray(data) ? data : []).map(normalizeEvent).filter(Boolean)
}

export async function fetchEvents(
  {
    category,
    city,
    format,
    mine,
    page = 1,
    pageSize = 36,
    search,
    signal,
    sort,
    status,
  } = {},
) {
  const payload = await apiRequest(
    `/events${queryString({
      category,
      city,
      format,
      mine: mine ? 'true' : undefined,
      page,
      perPage: pageSize,
      search,
      sort,
      status,
    })}`,
    { auth: Boolean(mine), signal },
  )

  return {
    events: normalizeCollection(payload),
    meta: payload?.meta ?? {},
  }
}

export async function fetchUpcomingEvents(options = {}) {
  const result = await fetchEvents(options)
  return result.events
}

export async function fetchEventById(eventId, { auth = true, signal } = {}) {
  if (eventId === undefined || eventId === null || String(eventId).trim() === '') {
    throw new TypeError('An event id is required.')
  }
  const payload = await apiRequest(`/events/${encodeURIComponent(eventId)}`, {
    auth,
    signal,
  })
  const event = normalizeEvent(unwrap(payload))
  if (!event) throw new Error('Hackaform returned an invalid event.')
  return event
}

export async function createEvent(values) {
  return normalizeEvent(
    unwrap(await apiRequest('/events', { body: values, method: 'POST' })),
  )
}

export async function updateEvent(eventId, values) {
  return normalizeEvent(
    unwrap(
      await apiRequest(`/events/${encodeURIComponent(eventId)}`, {
        body: values,
        method: 'PATCH',
      }),
    ),
  )
}

export async function deleteEvent(eventId) {
  await apiRequest(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

export const getUpcomingEvents = fetchUpcomingEvents
export const getEventById = fetchEventById
