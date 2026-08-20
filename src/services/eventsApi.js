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

export const EVENTS_API_BASE_URL = 'https://api.eventyay.com/v1'
export const EVENTYAY_WEB_URL = 'https://eventyay.com'
export const CODEFORCES_API_URL = 'https://codeforces.com/api/contest.list?gym=false'
export const WORDPRESS_EVENTS_API_URL = 'https://api.wordpress.org/events/1.0/'
export const GDG_COMMUNITY_WEB_URL = 'https://gdg.community.dev'
export const GDG_COMMUNITY_API_URL = `${GDG_COMMUNITY_WEB_URL}/api`
export const GDG_KENYA_SEARCH_URL = `${GDG_COMMUNITY_API_URL}/search/?${new URLSearchParams({
  country_code: 'KE',
  latitude: '-1.286389',
  longitude: '36.817223',
  order_by_proximity: 'true',
  proximity: '800',
  result_types: 'upcoming_event',
})}`

export const WORDPRESS_HUBS = [
  { city: 'Nairobi', timezone: 'Africa/Nairobi' },
  { city: 'Kampala', timezone: 'Africa/Kampala' },
  { city: 'Dar es Salaam', timezone: 'Africa/Dar_es_Salaam' },
  { city: 'London', timezone: 'Europe/London' },
  { city: 'Berlin', timezone: 'Europe/Berlin' },
]

const DEFAULT_PAGE_SIZE = 36
const DEFAULT_TIMEOUT_MS = 15_000
const CODEFORCES_CACHE_TTL_MS = 60_000
const GDG_SEARCH_CACHE_TTL_MS = 5 * 60_000
const GDG_DETAIL_CACHE_TTL_MS = 10 * 60_000
const JSON_API_MEDIA_TYPE = 'application/vnd.api+json'
const JSON_MEDIA_TYPE = 'application/json'

let codeforcesCache = null
let codeforcesInFlight = null
let gdgSearchCache = null
let gdgSearchInFlight = null
const gdgDetailCache = new Map()
const gdgDetailInFlight = new Map()

const COUNTRY_TIMEZONES = {
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  GB: 'Europe/London',
  KE: 'Africa/Nairobi',
  NL: 'Europe/Amsterdam',
  PL: 'Europe/Warsaw',
  TZ: 'Africa/Dar_es_Salaam',
  UG: 'Africa/Kampala',
}

function attribute(attributes, ...names) {
  for (const name of names) {
    if (attributes?.[name] !== undefined && attributes[name] !== null) {
      return attributes[name]
    }
  }
  return null
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

function asNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function asDateString(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function asAbsoluteUrl(value, base = EVENTYAY_WEB_URL) {
  if (!value || typeof value !== 'string') return null

  try {
    const url = new URL(value, base)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((tag) => normalizeWhitespace(typeof tag === 'object' ? tag?.name : tag))
        .filter(Boolean),
    ),
  ]
}

function includedRelationship(resource, relationshipName, included) {
  const linkage = resource?.relationships?.[relationshipName]?.data
  if (!linkage || Array.isArray(linkage)) return null

  return included.find(
    (entry) => String(entry.id) === String(linkage.id) && entry.type === linkage.type,
  )
}

export function normalizeTicket(resource) {
  if (!resource || typeof resource !== 'object') return null

  const attributes = resource.attributes ?? resource
  const type = String(attribute(attributes, 'type') ?? 'paid').toLowerCase()
  const price = asNumber(attribute(attributes, 'price'))
  const minimumPrice = asNumber(attribute(attributes, 'min-price', 'minimumPrice', 'minPrice'))
  const maximumPrice = asNumber(attribute(attributes, 'max-price', 'maximumPrice', 'maxPrice'))

  return {
    id: resource.id != null ? String(resource.id) : null,
    name: normalizeWhitespace(attribute(attributes, 'name')) || 'Admission',
    description: stripHtml(attribute(attributes, 'description')),
    type,
    price: type === 'free' ? 0 : price,
    minimumPrice,
    maximumPrice: maximumPrice && maximumPrice > 0 ? maximumPrice : null,
    quantity: asNumber(attribute(attributes, 'quantity')),
    minimumOrder: asNumber(attribute(attributes, 'min-order', 'minimumOrder')),
    maximumOrder: asNumber(attribute(attributes, 'max-order', 'maximumOrder')),
    salesStart: asDateString(attribute(attributes, 'sales-starts-at', 'salesStart')),
    salesEnd: asDateString(attribute(attributes, 'sales-ends-at', 'salesEnd')),
    hidden: asBoolean(attribute(attributes, 'is-hidden', 'hidden')),
  }
}

function ticketPricing(tickets, currency) {
  const visibleTickets = tickets.filter((ticket) => ticket && !ticket.hidden)
  const isFree =
    visibleTickets.length > 0 &&
    visibleTickets.every((ticket) => ticket.type === 'free' || ticket.price === 0)
  const prices = visibleTickets
    .map((ticket) => ticket.price ?? ticket.minimumPrice)
    .filter((price) => typeof price === 'number' && Number.isFinite(price) && price >= 0)

  return {
    currency,
    isFree: visibleTickets.length ? isFree : null,
    minimumPrice: prices.length ? Math.min(...prices) : null,
    maximumPrice: prices.length ? Math.max(...prices) : null,
  }
}

/**
 * Maps Eventyay's kebab-cased JSON:API resource into the stable shape used by
 * the React app. Description fields are always plain text.
 */
export function normalizeEvent(resource, { included = [], tickets = null } = {}) {
  if (!resource || typeof resource !== 'object') return null

  const attributes = resource.attributes ?? resource
  const id = resource.id != null ? String(resource.id) : null
  const source = normalizeWhitespace(attribute(attributes, 'source')) || 'Eventyay'
  const identifier = normalizeWhitespace(attribute(attributes, 'identifier'))
  const name = normalizeWhitespace(attribute(attributes, 'name', 'title')) || 'Untitled event'
  const description = stripHtml(attribute(attributes, 'description'))
  const ownerDescription = stripHtml(
    attribute(attributes, 'owner-description', 'ownerDescription'),
  )
  const startsAt = asDateString(attribute(attributes, 'starts-at', 'startsAt', 'startDate'))
  const endsAt = asDateString(attribute(attributes, 'ends-at', 'endsAt', 'endDate'))
  const timezone = normalizeWhitespace(attribute(attributes, 'timezone')) || null
  const online = asBoolean(attribute(attributes, 'online', 'is-online', 'isOnline'))
  const locationName = normalizeWhitespace(
    attribute(attributes, 'location-name', 'locationName'),
  )
  const searchableLocationName = normalizeWhitespace(
    attribute(attributes, 'searchable-location-name', 'searchableLocationName'),
  )
  const currency = normalizeWhitespace(
    attribute(attributes, 'payment-currency', 'paymentCurrency', 'currency'),
  ).toUpperCase() || null
  const normalizedTickets = Array.isArray(tickets)
    ? tickets.map(normalizeTicket).filter(Boolean)
    : []
  const pricing = ticketPricing(normalizedTickets, currency)
  const eventTypeResource = includedRelationship(resource, 'event-type', included)
  const suppliedCategory = normalizeWhitespace(
    attribute(attributes, 'event-type-name', 'eventTypeName', 'category') ??
      attribute(eventTypeResource?.attributes, 'name'),
  )
  const tags = normalizeTags(attribute(attributes, 'tags'))
  const originalImageUrl = asAbsoluteUrl(
    attribute(attributes, 'original-image-url', 'originalImageUrl'),
  )
  const largeImageUrl = asAbsoluteUrl(
    attribute(attributes, 'large-image-url', 'largeImageUrl'),
  )
  const thumbnailImageUrl = asAbsoluteUrl(
    attribute(attributes, 'thumbnail-image-url', 'thumbnailImageUrl'),
  )
  const logoUrl = asAbsoluteUrl(attribute(attributes, 'logo-url', 'logoUrl'))
  const iconUrl = asAbsoluteUrl(attribute(attributes, 'icon-image-url', 'iconImageUrl'))
  const imageUrl = originalImageUrl ?? largeImageUrl ?? thumbnailImageUrl ?? logoUrl ?? iconUrl
  const externalEventUrl = asAbsoluteUrl(
    attribute(attributes, 'external-event-url', 'externalEventUrl'),
  )
  const eventyayDetailsUrl =
    source === 'Eventyay' && identifier ? `${EVENTYAY_WEB_URL}/e/${identifier}/` : null
  const ticketUrl =
    asAbsoluteUrl(attribute(attributes, 'ticket-url', 'ticketUrl')) ??
    externalEventUrl ??
    eventyayDetailsUrl
  const organizer =
    normalizeWhitespace(attribute(attributes, 'owner-name', 'ownerName', 'organizer')) ||
    'Community organizer'
  const latitude = asNumber(attribute(attributes, 'latitude'))
  const longitude = asNumber(attribute(attributes, 'longitude'))
  const event = {
    id,
    identifier: identifier || id,
    name,
    title: name,
    description,
    shortDescription: truncateText(description || ownerDescription, 180),
    ownerDescription,
    organizer,
    ownerName: organizer,
    startsAt,
    endsAt,
    startDate: startsAt,
    endDate: endsAt,
    timezone,
    online,
    isOnline: online,
    location: {
      latitude,
      longitude,
      name: locationName || searchableLocationName || null,
      online,
      shortName: searchableLocationName || locationName || null,
    },
    locationName: locationName || searchableLocationName || null,
    searchableLocationName: searchableLocationName || locationName || null,
    latitude,
    longitude,
    imageUrl,
    thumbnailUrl: thumbnailImageUrl ?? imageUrl,
    images: {
      icon: iconUrl,
      large: largeImageUrl,
      logo: logoUrl,
      original: originalImageUrl,
      thumbnail: thumbnailImageUrl,
    },
    ticketUrl,
    externalUrl: externalEventUrl ?? ticketUrl,
    externalEventUrl,
    detailsUrl: eventyayDetailsUrl ?? externalEventUrl ?? ticketUrl,
    currency,
    tickets: normalizedTickets,
    ticketsLoaded: Array.isArray(tickets),
    isFree: pricing.isFree,
    price: pricing.minimumPrice,
    minimumPrice: pricing.minimumPrice,
    maximumPrice: pricing.maximumPrice,
    privacy: String(attribute(attributes, 'privacy') ?? '').toLowerCase(),
    state: String(attribute(attributes, 'state') ?? '').toLowerCase(),
    featured: asBoolean(attribute(attributes, 'is-featured', 'featured')),
    promoted: asBoolean(attribute(attributes, 'is-promoted', 'promoted')),
    tags,
    category: suppliedCategory,
    source,
    sourceId: normalizeWhitespace(attribute(attributes, 'source-id', 'sourceId')) || id,
  }

  event.category = suppliedCategory || inferCategory(event)
  event.status = getEventStatus(event)
  event.dateLabel = formatDateRange(startsAt, endsAt, { timeZone: timezone })
  event.locationLabel = formatLocation(event)
  event.priceLabel = formatPrice(event)

  return event
}

export class EventsApiError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'EventsApiError'
    this.code = options.code ?? 'EVENTS_API_ERROR'
    this.status = options.status ?? null
    this.statusText = options.statusText ?? null
    this.details = options.details ?? null
    this.url = options.url ?? null
    this.retriable =
      options.retriable ??
      (options.status == null ||
        options.status === 408 ||
        options.status === 429 ||
        options.status >= 500)
  }
}

export function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ABORT_ERR'
}

function jsonApiErrorMessage(payload, fallback) {
  const apiErrors = Array.isArray(payload?.errors) ? payload.errors : []
  const messages = apiErrors
    .map((error) => error?.detail ?? error?.title)
    .filter(Boolean)

  return messages.length ? messages.join(' ') : fallback
}

function requestSignal(externalSignal, timeoutMs) {
  const controller = new AbortController()
  let timedOut = false

  const abortFromExternal = () => controller.abort(externalSignal.reason)
  if (externalSignal?.aborted) abortFromExternal()
  else externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeoutMs)
      : null

  return {
    cleanup() {
      if (timeoutId) clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortFromExternal)
    },
    signal: controller.signal,
    timedOut: () => timedOut,
  }
}

async function requestJson(
  path,
  { accept = JSON_API_MEDIA_TYPE, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  const url = path.startsWith('http') ? path : `${EVENTS_API_BASE_URL}${path}`
  const linkedSignal = requestSignal(signal, timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { Accept: accept },
      method: 'GET',
      signal: linkedSignal.signal,
    })
    const responseText = await response.text()
    let payload = null

    if (responseText) {
      try {
        payload = JSON.parse(responseText)
      } catch (cause) {
        throw new EventsApiError('The events service returned an unreadable response.', {
          cause,
          code: 'INVALID_RESPONSE',
          retriable: response.status >= 500,
          status: response.status,
          statusText: response.statusText,
          url,
        })
      }
    }

    if (!response.ok || payload?.errors) {
      throw new EventsApiError(
        jsonApiErrorMessage(payload, `The events service returned ${response.status}.`),
        {
          code: response.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
          details: payload?.errors ?? payload,
          status: response.status,
          statusText: response.statusText,
          url,
        },
      )
    }

    return payload ?? {}
  } catch (error) {
    if (signal?.aborted) {
      if (isAbortError(signal.reason)) throw signal.reason
      throw new DOMException('The request was cancelled.', 'AbortError')
    }

    if (linkedSignal.timedOut()) {
      throw new EventsApiError('The events service took too long to respond. Please try again.', {
        cause: error,
        code: 'TIMEOUT',
        retriable: true,
        url,
      })
    }

    if (isAbortError(error) || error instanceof EventsApiError) throw error

    throw new EventsApiError('Could not reach the events service. Check your connection and retry.', {
      cause: error,
      code: 'NETWORK_ERROR',
      retriable: true,
      url,
    })
  } finally {
    linkedSignal.cleanup()
  }
}

function safePositiveInteger(value, fallback, maximum = Number.POSITIVE_INFINITY) {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) && number > 0 ? Math.min(number, maximum) : fallback
}

function upcomingEventFilters(from, to) {
  const filters = [
    { name: 'state', op: 'eq', val: 'published' },
    { name: 'privacy', op: 'eq', val: 'public' },
    { name: 'starts-at', op: 'ge', val: from.toISOString() },
  ]

  if (to) filters.push({ name: 'starts-at', op: 'le', val: to.toISOString() })
  return filters
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return
  if (isAbortError(signal.reason)) throw signal.reason
  throw new DOMException('The request was cancelled.', 'AbortError')
}

function waitForSharedRequest(promise, signal) {
  if (!signal) return promise

  try {
    throwIfAborted(signal)
  } catch (error) {
    return Promise.reject(error)
  }

  return new Promise((resolve, reject) => {
    const removeAbortListener = () => signal.removeEventListener('abort', handleAbort)
    const handleAbort = () => {
      removeAbortListener()

      try {
        throwIfAborted(signal)
      } catch (error) {
        reject(error)
      }
    }

    signal.addEventListener('abort', handleAbort, { once: true })
    promise.then(
      (value) => {
        removeAbortListener()
        resolve(value)
      },
      (error) => {
        removeAbortListener()
        reject(error)
      },
    )
  })
}

function stableHash(value) {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(36)
}

function unixDate(seconds) {
  const value = Number(seconds)
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000) : null
}

function normalizeCodeforcesContest(contest) {
  if (!contest || contest.id == null) return null

  const start = unixDate(contest.startTimeSeconds)
  if (!start) return null

  const durationSeconds = Math.max(0, Number(contest.durationSeconds) || 0)
  const end = new Date(start.getTime() + durationSeconds * 1000)
  const name = stripHtml(contest.name) || `Codeforces Contest ${contest.id}`
  const category = /\b(challenge|cup|global|icpc|marathon)\b/i.test(name)
    ? 'Hackathon'
    : 'Technology'
  const durationHours = durationSeconds / 3600
  const durationLabel = Number.isInteger(durationHours)
    ? `${durationHours} hour${durationHours === 1 ? '' : 's'}`
    : `${durationHours.toFixed(1)} hours`
  const officialUrl = `https://codeforces.com/contest/${contest.id}`
  const id = `cf-${contest.id}`
  const event = normalizeEvent(
    {
      id,
      attributes: {
        category,
        description: `${name} is an online competitive programming event hosted by Codeforces. Participants solve algorithmic problems during a ${durationLabel} contest window.`,
        'ends-at': end.toISOString(),
        'external-event-url': officialUrl,
        identifier: id,
        name,
        online: true,
        'owner-name': 'Codeforces',
        privacy: 'public',
        source: 'Codeforces',
        'source-id': String(contest.id),
        'starts-at': start.toISOString(),
        state: 'published',
        'ticket-url': officialUrl,
        timezone: 'UTC',
      },
    },
    {
      tickets: [
        {
          id: `cf-ticket-${contest.id}`,
          attributes: { name: 'Free participation', price: 0, type: 'free' },
        },
      ],
    },
  )

  if (event) {
    event.contestType = contest.type ?? null
    event.phase = contest.phase ?? null
  }

  return event
}

async function codeforcesPayload({ signal, timeoutMs } = {}) {
  throwIfAborted(signal)

  if (codeforcesCache?.expiresAt > Date.now()) {
    return codeforcesCache.value
  }

  if (!codeforcesInFlight) {
    const sharedRequest = requestJson(CODEFORCES_API_URL, {
      accept: JSON_MEDIA_TYPE,
      // A caller abort only detaches that caller. The shared network request
      // continues so other consumers can finish and populate the cache.
      timeoutMs,
    })
      .then((payload) => {
        if (payload.status !== 'OK' || !Array.isArray(payload.result)) {
          throw new EventsApiError(
            stripHtml(payload.comment) || 'Codeforces returned an unexpected response.',
            {
              code: 'INVALID_RESPONSE',
              details: payload,
              url: CODEFORCES_API_URL,
            },
          )
        }

        codeforcesCache = {
          expiresAt: Date.now() + CODEFORCES_CACHE_TTL_MS,
          value: payload.result,
        }
        return payload.result
      })
      .finally(() => {
        if (codeforcesInFlight === sharedRequest) codeforcesInFlight = null
      })

    codeforcesInFlight = sharedRequest
  }

  return waitForSharedRequest(codeforcesInFlight, signal)
}

export async function fetchCodeforcesEvents({
  from = new Date(),
  signal,
  timeoutMs,
  to,
} = {}) {
  const startBoundary = new Date(from)
  const endBoundary = to ? new Date(to) : null

  if (Number.isNaN(startBoundary.getTime())) {
    throw new TypeError('The "from" value must be a valid date.')
  }
  if (endBoundary && Number.isNaN(endBoundary.getTime())) {
    throw new TypeError('The "to" value must be a valid date.')
  }

  const contests = await codeforcesPayload({ signal, timeoutMs })

  return contests
    .filter((contest) => {
      const start = unixDate(contest.startTimeSeconds)
      return (
        start &&
        start >= startBoundary &&
        (!endBoundary || start <= endBoundary) &&
        contest.phase === 'BEFORE'
      )
    })
    .map(normalizeCodeforcesContest)
    .filter(Boolean)
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))
}

function wordpressTimestamp(event, unixKey, dateKey) {
  const unixValue = unixDate(event?.[unixKey])
  if (unixValue) return unixValue

  const dateValue = event?.[dateKey]
  if (!dateValue) return null

  const parsed = new Date(String(dateValue).replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeWordPressEvent(rawEvent, hub) {
  if (!rawEvent || typeof rawEvent !== 'object') return null

  const startsAt = wordpressTimestamp(rawEvent, 'start_unix_timestamp', 'date')
  if (!startsAt) return null

  const endsAt = wordpressTimestamp(rawEvent, 'end_unix_timestamp', 'end_date')
  const name = stripHtml(rawEvent.title) || 'WordPress community event'
  const organizer = stripHtml(rawEvent.meetup) || 'WordPress Community'
  const rawLocation =
    typeof rawEvent.location === 'string'
      ? rawEvent.location
      : rawEvent.location?.location
  const locationName = normalizeWhitespace(rawLocation || hub.city)
  const country = normalizeWhitespace(rawEvent.location?.country).toUpperCase()
  const online = /\bonline\b/i.test(`${locationName} ${name}`)
  const externalUrl = asAbsoluteUrl(rawEvent.url ?? rawEvent.meetup_url)
  const identity =
    externalUrl?.replace(/\/$/, '').toLowerCase() ??
    `${name.toLowerCase()}|${startsAt.toISOString()}|${locationName.toLowerCase()}`
  const id = `wp-${stableHash(identity)}`
  const category = inferCategory({
    description: `${rawEvent.type ?? ''} WordPress web publishing technology`,
    name,
  })
  const event = normalizeEvent({
    id,
    attributes: {
      category: category === 'Other' ? 'Technology' : category,
      description: `${name} is an upcoming WordPress community event hosted by ${organizer}. Visit the official event page for the latest agenda and registration details.`,
      'ends-at': endsAt?.toISOString() ?? null,
      'external-event-url': externalUrl,
      identifier: id,
      latitude: asNumber(rawEvent.location?.latitude),
      'location-name': online ? 'Online' : locationName,
      longitude: asNumber(rawEvent.location?.longitude),
      name,
      online,
      'owner-name': organizer,
      privacy: 'public',
      'searchable-location-name': online ? hub.city : locationName,
      source: 'WordPress',
      'source-id': identity,
      'starts-at': startsAt.toISOString(),
      state: 'published',
      'ticket-url': externalUrl,
      timezone: COUNTRY_TIMEZONES[country] ?? hub.timezone,
    },
  })

  if (event) {
    event.countryCode = country || null
    event.countryName = country === 'KE' ? 'Kenya' : null
    event.eventType = normalizeWhitespace(rawEvent.type) || 'community event'
    event.hub = hub.city
    event.isKenyan = country === 'KE'
  }

  return event
}

async function fetchWordPressHub(hub, { from, signal, timeoutMs, to } = {}) {
  const params = new URLSearchParams({ location: hub.city, number: '20' })
  const url = `${WORDPRESS_EVENTS_API_URL}?${params}`
  const payload = await requestJson(url, {
    accept: JSON_MEDIA_TYPE,
    signal,
    timeoutMs,
  })

  if (!Array.isArray(payload.events)) {
    throw new EventsApiError(`WordPress returned an unexpected response for ${hub.city}.`, {
      code: 'INVALID_RESPONSE',
      details: payload,
      url,
    })
  }

  return payload.events
    .map((event) => normalizeWordPressEvent(event, hub))
    .filter((event) => {
      if (!event) return false
      const start = new Date(event.startsAt)
      return start >= from && (!to || start <= to)
    })
}

export async function fetchWordPressEvents({
  from = new Date(),
  signal,
  timeoutMs,
  to,
} = {}) {
  const startBoundary = new Date(from)
  const endBoundary = to ? new Date(to) : null

  if (Number.isNaN(startBoundary.getTime())) {
    throw new TypeError('The "from" value must be a valid date.')
  }
  if (endBoundary && Number.isNaN(endBoundary.getTime())) {
    throw new TypeError('The "to" value must be a valid date.')
  }

  const results = await Promise.allSettled(
    WORDPRESS_HUBS.map((hub) =>
      fetchWordPressHub(hub, {
        from: startBoundary,
        signal,
        timeoutMs,
        to: endBoundary,
      }),
    ),
  )
  throwIfAborted(signal)

  const successful = results.filter((result) => result.status === 'fulfilled')
  if (!successful.length) {
    throw results.find((result) => result.status === 'rejected')?.reason
  }

  const uniqueEvents = new Map()
  for (const result of successful) {
    for (const event of result.value) {
      if (!uniqueEvents.has(event.id)) uniqueEvents.set(event.id, event)
    }
  }

  return [...uniqueEvents.values()].sort(
    (left, right) => new Date(left.startsAt) - new Date(right.startsAt),
  )
}

function isKenyanGdgResource(resource) {
  return normalizeWhitespace(resource?.chapter?.country).toUpperCase() === 'KE'
}

function asGdgOfficialUrl(value) {
  const absoluteUrl = asAbsoluteUrl(value, GDG_COMMUNITY_WEB_URL)
  if (!absoluteUrl) return null

  try {
    const url = new URL(absoluteUrl)
    return url.protocol === 'https:' && url.hostname === 'gdg.community.dev'
      ? url.href
      : null
  } catch {
    return null
  }
}

function firstImageUrl(resource) {
  const candidates = [
    resource?.cropped_banner_url,
    resource?.picture?.url,
    resource?.picture?.thumbnail_url,
    resource?.event_type_banner?.url,
    resource?.event_type_logo?.url,
    resource?.chapter?.logo?.url,
  ]

  return candidates.map((candidate) => asAbsoluteUrl(candidate)).find(Boolean) ?? null
}

function uniqueLocationParts(parts) {
  const seen = new Set()

  return parts
    .map((part) => stripHtml(part))
    .filter((part) => {
      const key = part.toLocaleLowerCase()
      if (!part || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function gdgLocationName(resource, online) {
  if (online) return 'Online'

  const city = resource.hide_location
    ? resource.chapter?.city
    : resource.venue_city ?? resource.city ?? resource.chapter?.city
  const venue = resource.hide_location ? null : resource.venue_name
  const parts = uniqueLocationParts([venue, city])

  if (!parts.some((part) => /\bkenya\b/i.test(part))) parts.push('Kenya')
  return parts.join(', ') || 'Kenya'
}

function gdgTickets(resource) {
  const tickets = Array.isArray(resource?.tickets)
    ? resource.tickets
        .map((ticket) => {
          if (!ticket || ticket.id == null) return null

          const price = asNumber(ticket.price ?? ticket.reported_price)
          return {
            id: `gdg-ticket-${ticket.id}`,
            attributes: {
              description: ticket.description,
              'is-hidden': ticket.visible === false,
              name: ticket.title || 'Admission',
              price,
              quantity: asNumber(ticket.total_count),
              'sales-ends-at': ticket.sale_end_date,
              'sales-starts-at': ticket.sale_start_date,
              type: price === 0 ? 'free' : 'paid',
            },
          }
        })
        .filter(Boolean)
    : null

  if (tickets?.length) return tickets

  if (/\bfree\b/i.test(resource?.event_type_title ?? '')) {
    return [
      {
        id: `gdg-ticket-${resource.id}-free`,
        attributes: { name: 'Free registration', price: 0, type: 'free' },
      },
    ]
  }

  return tickets
}

/**
 * Maps GDG Community's Bevy response into Hackaform's stable event model.
 * Only Kenyan chapter events are accepted, even though the proximity search
 * can include events from neighbouring countries.
 */
export function normalizeGdgEvent(resource) {
  if (!resource || typeof resource !== 'object' || !isKenyanGdgResource(resource)) {
    return null
  }

  const sourceId = resource.id == null ? '' : String(resource.id).trim()
  const startsAt = asDateString(resource.start_date_iso ?? resource.start_date)
  if (!sourceId || !startsAt) return null

  const name = stripHtml(resource.title) || 'Google Developer Groups event'
  const description =
    stripHtml(resource.description ?? resource.description_short) ||
    `${name} is an upcoming Google Developer Groups event in Kenya. Visit the official event page for the latest programme and registration details.`
  const audienceType = normalizeWhitespace(resource.audience_type).toUpperCase()
  const online =
    resource.is_virtual_event === true ||
    audienceType === 'VIRTUAL' ||
    audienceType === 'ONLINE'
  const city = stripHtml(resource.venue_city ?? resource.city ?? resource.chapter?.city)
  const locationName = gdgLocationName(resource, online)
  const officialUrl = asGdgOfficialUrl(resource.url ?? resource.relative_url)
  const organizer =
    stripHtml(resource.chapter?.title) || 'Google Developer Groups Kenya'
  const tags = normalizeTags(resource.tags)
  const inferredCategory = inferCategory({ description, name, tags })
  const category = inferredCategory === 'Other' ? 'Technology' : inferredCategory
  const tickets = gdgTickets(resource)
  const currency = normalizeWhitespace(
    resource.currency ?? resource.tickets?.find?.((ticket) => ticket?.currency)?.currency,
  )
  const imageUrl = firstImageUrl(resource)
  const id = `gdg-${sourceId}`
  const event = normalizeEvent(
    {
      id,
      attributes: {
        category,
        currency,
        description,
        'ends-at': resource.end_date_iso ?? resource.end_date,
        'external-event-url': officialUrl,
        identifier: id,
        'large-image-url': imageUrl,
        latitude: asNumber(resource.venue_latitude),
        'location-name': locationName,
        longitude: asNumber(resource.venue_longitude),
        name,
        online,
        'owner-name': organizer,
        privacy: 'public',
        'searchable-location-name': online
          ? normalizeWhitespace([city, 'Kenya'].filter(Boolean).join(', '))
          : locationName,
        source: 'GDG Community',
        'source-id': sourceId,
        'starts-at': startsAt,
        state: normalizeWhitespace(resource.status || 'published').toLowerCase(),
        tags,
        'ticket-url': officialUrl,
        timezone:
          normalizeWhitespace(resource.event_timezone ?? resource.chapter?.timezone) ||
          'Africa/Nairobi',
      },
    },
    { tickets },
  )

  if (event) {
    event.audienceType = audienceType || null
    event.chapter = organizer
    event.city = city || null
    event.countryCode = 'KE'
    event.countryName = 'Kenya'
    event.eventType = normalizeWhitespace(resource.event_type_title) || null
    event.isKenyan = true
    event.registrationRequired = resource.registration_required ?? null
  }

  return event
}

async function gdgSearchPayload({ signal, timeoutMs } = {}) {
  throwIfAborted(signal)

  if (gdgSearchCache?.expiresAt > Date.now()) {
    return gdgSearchCache.value
  }

  if (!gdgSearchInFlight) {
    const sharedRequest = requestJson(GDG_KENYA_SEARCH_URL, {
      accept: JSON_MEDIA_TYPE,
      // The response is shared so one unmounted view cannot cancel another
      // view's request or prevent the cache from being populated.
      timeoutMs,
    })
      .then((payload) => {
        if (!Array.isArray(payload.results)) {
          throw new EventsApiError('GDG Community returned an unexpected response.', {
            code: 'INVALID_RESPONSE',
            details: payload,
            url: GDG_KENYA_SEARCH_URL,
          })
        }

        gdgSearchCache = {
          expiresAt: Date.now() + GDG_SEARCH_CACHE_TTL_MS,
          value: payload.results,
        }
        return payload.results
      })
      .finally(() => {
        if (gdgSearchInFlight === sharedRequest) gdgSearchInFlight = null
      })

    gdgSearchInFlight = sharedRequest
  }

  return waitForSharedRequest(gdgSearchInFlight, signal)
}

export async function fetchGdgKenyaEvents({
  from = new Date(),
  signal,
  timeoutMs,
  to,
} = {}) {
  const startBoundary = new Date(from)
  const endBoundary = to ? new Date(to) : null

  if (Number.isNaN(startBoundary.getTime())) {
    throw new TypeError('The "from" value must be a valid date.')
  }
  if (endBoundary && Number.isNaN(endBoundary.getTime())) {
    throw new TypeError('The "to" value must be a valid date.')
  }

  const resources = await gdgSearchPayload({ signal, timeoutMs })

  return resources
    .filter(
      (resource) =>
        isKenyanGdgResource(resource) &&
        !resource.is_hidden &&
        !resource.is_test &&
        (!resource.result_type || resource.result_type === 'upcoming_event'),
    )
    .map(normalizeGdgEvent)
    .filter((event) => {
      if (!event) return false
      const start = new Date(event.startsAt)
      return start >= startBoundary && (!endBoundary || start <= endBoundary)
    })
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))
}

async function gdgDetailPayload(sourceId, { signal, timeoutMs } = {}) {
  throwIfAborted(signal)

  const cached = gdgDetailCache.get(sourceId)
  if (cached?.expiresAt > Date.now()) return cached.value

  if (!gdgDetailInFlight.has(sourceId)) {
    const url = `${GDG_COMMUNITY_API_URL}/event/${encodeURIComponent(sourceId)}/`
    const sharedRequest = requestJson(url, {
      accept: JSON_MEDIA_TYPE,
      timeoutMs,
    })
      .then((payload) => {
        if (!payload || typeof payload !== 'object' || String(payload.id) !== sourceId) {
          throw new EventsApiError('GDG Community returned an unexpected event response.', {
            code: 'INVALID_RESPONSE',
            details: payload,
            url,
          })
        }

        if (gdgDetailCache.size >= 50) {
          gdgDetailCache.delete(gdgDetailCache.keys().next().value)
        }
        gdgDetailCache.set(sourceId, {
          expiresAt: Date.now() + GDG_DETAIL_CACHE_TTL_MS,
          value: payload,
        })
        return payload
      })
      .finally(() => {
        if (gdgDetailInFlight.get(sourceId) === sharedRequest) {
          gdgDetailInFlight.delete(sourceId)
        }
      })

    gdgDetailInFlight.set(sourceId, sharedRequest)
  }

  return waitForSharedRequest(gdgDetailInFlight.get(sourceId), signal)
}

function eventTitleKey(event) {
  return String(event.name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\d]+/gi, ' ')
    .trim()
    .toLowerCase()
}

function deduplicateAggregatedEvents(events) {
  const seen = new Set()

  return events.filter((event) => {
    const key =
      event.source === 'Eventyay'
        ? `eventyay-title:${eventTitleKey(event)}`
        : `${event.source}:${event.id}`

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function compareKenyaFirst(left, right) {
  const kenyaPriority = Number(Boolean(right.isKenyan)) - Number(Boolean(left.isKenyan))
  if (kenyaPriority !== 0) return kenyaPriority

  const leftTime = new Date(left.startsAt).getTime()
  const rightTime = new Date(right.startsAt).getTime()
  return (Number.isFinite(leftTime) ? leftTime : Number.POSITIVE_INFINITY) -
    (Number.isFinite(rightTime) ? rightTime : Number.POSITIVE_INFINITY)
}

export async function fetchUpcomingEventsPage({
  from = new Date(),
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  signal,
  timeoutMs,
  to,
} = {}) {
  const startDate = new Date(from)
  const endDate = to ? new Date(to) : null

  if (Number.isNaN(startDate.getTime())) {
    throw new TypeError('The "from" value must be a valid date.')
  }
  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new TypeError('The "to" value must be a valid date.')
  }

  const resolvedPage = safePositiveInteger(page, 1)
  const resolvedPageSize = safePositiveInteger(pageSize, DEFAULT_PAGE_SIZE, 100)
  const params = new URLSearchParams({
    filter: JSON.stringify(upcomingEventFilters(startDate, endDate)),
    'page[number]': String(resolvedPage),
    'page[size]': String(resolvedPageSize),
    sort: 'starts-at',
  })
  const payload = await requestJson(`/events?${params}`, { signal, timeoutMs })
  const resources = Array.isArray(payload.data) ? payload.data : []
  const included = Array.isArray(payload.included) ? payload.included : []
  const events = resources
    .map((resource) => normalizeEvent(resource, { included }))
    .filter(
      (event) =>
        event &&
        event.state === 'published' &&
        event.privacy === 'public' &&
        (!event.startsAt || new Date(event.startsAt) >= startDate),
    )
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))

  return {
    events,
    hasNextPage: Boolean(payload.links?.next),
    links: payload.links ?? {},
    page: resolvedPage,
    pageSize: resolvedPageSize,
    total: asNumber(payload.meta?.count) ?? events.length,
  }
}

/**
 * Aggregates four no-key, browser-CORS-safe sources. A source may fail without
 * hiding successful results from the others; the request rejects only when all
 * four sources are unavailable.
 */
export async function fetchUpcomingEvents({
  from = new Date(),
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  signal,
  timeoutMs,
  to,
} = {}) {
  const startBoundary = new Date(from)
  const endBoundary = to ? new Date(to) : null

  if (Number.isNaN(startBoundary.getTime())) {
    throw new TypeError('The "from" value must be a valid date.')
  }
  if (endBoundary && Number.isNaN(endBoundary.getTime())) {
    throw new TypeError('The "to" value must be a valid date.')
  }

  const resolvedPage = safePositiveInteger(page, 1)
  const resolvedPageSize = safePositiveInteger(pageSize, DEFAULT_PAGE_SIZE, 100)
  const eventyayPageSize = Math.min(
    100,
    Math.max(DEFAULT_PAGE_SIZE, resolvedPage * resolvedPageSize * 3),
  )
  const results = await Promise.allSettled([
    fetchUpcomingEventsPage({
      from: startBoundary,
      page: 1,
      pageSize: eventyayPageSize,
      signal,
      timeoutMs,
      to: endBoundary,
    }).then((result) => result.events),
    fetchCodeforcesEvents({
      from: startBoundary,
      signal,
      timeoutMs,
      to: endBoundary,
    }),
    fetchWordPressEvents({
      from: startBoundary,
      signal,
      timeoutMs,
      to: endBoundary,
    }),
    fetchGdgKenyaEvents({
      from: startBoundary,
      signal,
      timeoutMs,
      to: endBoundary,
    }),
  ])
  throwIfAborted(signal)

  const successful = results.filter((result) => result.status === 'fulfilled')
  if (!successful.length) {
    throw results.find((result) => result.status === 'rejected')?.reason
  }

  const merged = successful
    .flatMap((result) => result.value)
    .filter(Boolean)
    .sort(compareKenyaFirst)
  const uniqueEvents = deduplicateAggregatedEvents(merged)
  const offset = (resolvedPage - 1) * resolvedPageSize

  return uniqueEvents.slice(offset, offset + resolvedPageSize)
}

export async function fetchEventTickets(eventId, options = {}) {
  if (eventId == null || String(eventId).trim() === '') return []

  const id = encodeURIComponent(String(eventId).trim())
  const payload = await requestJson(`/events/${id}/tickets`, options)
  return (Array.isArray(payload.data) ? payload.data : []).map(normalizeTicket).filter(Boolean)
}

function sourceEventNotFound(source) {
  return new EventsApiError(`This ${source} event could not be found.`, {
    code: 'NOT_FOUND',
    status: 404,
  })
}

async function fetchCodeforcesEventById(eventId, options) {
  const sourceId = String(eventId).slice(3)
  if (!/^\d+$/.test(sourceId)) throw sourceEventNotFound('Codeforces')

  const contests = await codeforcesPayload(options)
  const contest = contests.find((item) => String(item.id) === sourceId)
  const event = normalizeCodeforcesContest(contest)
  if (!event) throw sourceEventNotFound('Codeforces')
  return event
}

async function fetchWordPressEventById(eventId, options) {
  const events = await fetchWordPressEvents({
    ...options,
    // The WordPress endpoint already limits results to its active catalogue;
    // an old boundary here would otherwise filter a still-resolvable event.
    from: new Date(0),
  })
  const event = events.find((item) => item.id === eventId)
  if (!event) throw sourceEventNotFound('WordPress')
  return event
}

async function fetchGdgEventById(eventId, options) {
  const sourceId = String(eventId).slice(4)
  if (!/^\d+$/.test(sourceId)) throw sourceEventNotFound('GDG Community')

  const resource = await gdgDetailPayload(sourceId, options)
  if (
    !isKenyanGdgResource(resource) ||
    resource.is_hidden ||
    resource.is_test ||
    (resource.status && String(resource.status).toLowerCase() !== 'published')
  ) {
    throw sourceEventNotFound('GDG Community')
  }

  const event = normalizeGdgEvent(resource)
  if (!event) throw sourceEventNotFound('GDG Community')
  return event
}

export async function fetchEventById(
  eventId,
  { includeTickets = true, signal, timeoutMs } = {},
) {
  if (eventId == null || String(eventId).trim() === '') {
    throw new TypeError('An event id is required.')
  }

  const requestedId = String(eventId).trim()

  if (requestedId.startsWith('cf-')) {
    return fetchCodeforcesEventById(requestedId, { signal, timeoutMs })
  }
  if (requestedId.startsWith('wp-')) {
    return fetchWordPressEventById(requestedId, { signal, timeoutMs })
  }
  if (requestedId.startsWith('gdg-')) {
    return fetchGdgEventById(requestedId, { signal, timeoutMs })
  }

  const id = encodeURIComponent(requestedId)
  const eventRequest = requestJson(`/events/${id}`, { signal, timeoutMs })
  const ticketsRequest = includeTickets
    ? fetchEventTickets(eventId, { signal, timeoutMs }).catch((error) => {
        if (isAbortError(error)) throw error
        return null
      })
    : Promise.resolve(null)
  const [payload, tickets] = await Promise.all([eventRequest, ticketsRequest])
  const event = normalizeEvent(payload.data, {
    included: Array.isArray(payload.included) ? payload.included : [],
    tickets,
  })

  if (!event) {
    throw new EventsApiError('This event could not be found.', {
      code: 'NOT_FOUND',
      status: 404,
    })
  }

  return event
}

export const getUpcomingEvents = fetchUpcomingEvents
export const getEventById = fetchEventById
