const DEFAULT_LOCALE = 'en-KE'

const HTML_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  lt: '<',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rsquo: '’',
}

const CATEGORY_RULES = [
  ['Hackathon', /\b(hackathon|hack day|code jam|coding challenge)\b/i],
  ['Technology', /\b(tech|technology|software|developer|programming|open source|wordpress|data|ai|artificial intelligence|cyber|cloud|web3|blockchain)\b/i],
  ['Business', /\b(business|startup|entrepreneur|founder|finance|marketing|leadership|networking)\b/i],
  ['Education', /\b(education|training|workshop|course|academy|student|learning|conference)\b/i],
  ['Music', /\b(music|concert|festival|dj|recital|band|choir)\b/i],
  ['Arts & Culture', /\b(art|culture|film|theatre|theater|dance|poetry|museum|creative)\b/i],
  ['Sports', /\b(sport|football|soccer|run|marathon|fitness|yoga|tournament)\b/i],
  ['Community', /\b(community|volunteer|social|meetup|nonprofit|charity)\b/i],
]

function decodeEntity(entity) {
  if (entity[0] === '#') {
    const isHex = entity[1]?.toLowerCase() === 'x'
    const value = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)

    if (Number.isFinite(value) && value > 0 && value <= 0x10ffff) {
      try {
        return String.fromCodePoint(value)
      } catch {
        return ' '
      }
    }
  }

  return HTML_ENTITIES[entity.toLowerCase()] ?? `&${entity};`
}

export function normalizeWhitespace(value = '') {
  if (value == null) return ''

  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Converts untrusted HTML into plain text. No markup is returned to the UI,
 * so consumers do not need dangerouslySetInnerHTML.
 */
export function stripHtml(value = '') {
  if (value == null || value === '') return ''

  const html = String(value)

  if (typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(html, 'text/html')
    document
      .querySelectorAll('script, style, template, noscript, iframe, object, svg')
      .forEach((element) => element.remove())

    return normalizeWhitespace(document.body?.textContent ?? '')
  }

  // DOMParser is not present during Node-based tests or server rendering.
  return normalizeWhitespace(
    html
      .replace(/<(script|style|template|noscript|iframe|object|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<(br|hr)\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|section|article|tr)>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi, (_, entity) => decodeEntity(entity)),
  )
}

export const sanitizeText = stripHtml

export function truncateText(value, maximumLength = 160) {
  const text = normalizeWhitespace(value)
  const limit = Math.max(1, Number(maximumLength) || 160)

  if (text.length <= limit) return text

  const shortened = text.slice(0, Math.max(1, limit - 1))
  const lastSpace = shortened.lastIndexOf(' ')
  const naturalCut = lastSpace > limit * 0.65 ? shortened.slice(0, lastSpace) : shortened

  return `${naturalCut.trimEnd()}…`
}

export function toValidDate(value) {
  if (!value) return null

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function safeDateFormatter(locale, options) {
  try {
    return new Intl.DateTimeFormat(locale, options)
  } catch {
    const { timeZone: _invalidTimeZone, ...safeOptions } = options
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, safeOptions)
  }
}

export function formatEventDate(
  value,
  { locale = DEFAULT_LOCALE, timeZone, includeYear = true, includeTime = true } = {},
) {
  const date = toValidDate(value)
  if (!date) return 'Date to be announced'

  return safeDateFormatter(locale, {
    day: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? '2-digit' : undefined,
    month: 'short',
    timeZone,
    weekday: 'short',
    year: includeYear ? 'numeric' : undefined,
  }).format(date)
}

function dayKey(date, locale, timeZone) {
  return safeDateFormatter(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).format(date)
}

export function formatDateRange(
  startsAt,
  endsAt,
  { locale = DEFAULT_LOCALE, timeZone } = {},
) {
  const start = toValidDate(startsAt)
  const end = toValidDate(endsAt)

  if (!start && !end) return 'Date to be announced'
  if (!start) return `Until ${formatEventDate(end, { locale, timeZone })}`
  if (!end || end <= start) return formatEventDate(start, { locale, timeZone })

  const sameDay = dayKey(start, locale, timeZone) === dayKey(end, locale, timeZone)

  if (sameDay) {
    const datePart = safeDateFormatter(locale, {
      day: 'numeric',
      month: 'short',
      timeZone,
      weekday: 'short',
      year: 'numeric',
    }).format(start)
    const timeFormatter = safeDateFormatter(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    })

    return `${datePart} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
  }

  return `${formatEventDate(start, { locale, timeZone })} – ${formatEventDate(end, {
    locale,
    timeZone,
  })}`
}

function amountFrom(value) {
  if (value == null) return null

  const number = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function priceFacts(value, suppliedCurrency) {
  if (value == null || typeof value !== 'object') {
    return {
      currency: suppliedCurrency,
      isFree: amountFrom(value) === 0 ? true : null,
      maximum: amountFrom(value),
      minimum: amountFrom(value),
    }
  }

  const visibleTickets = Array.isArray(value.tickets)
    ? value.tickets.filter((ticket) => !ticket.hidden)
    : []
  const ticketPrices = visibleTickets
    .map((ticket) => amountFrom(ticket.price ?? ticket.minimumPrice ?? ticket.minPrice))
    .filter((price) => price != null)
  const explicitMinimum = amountFrom(value.minimumPrice ?? value.minPrice ?? value.price)
  const explicitMaximum = amountFrom(value.maximumPrice ?? value.maxPrice ?? value.price)
  const minimum = explicitMinimum ?? (ticketPrices.length ? Math.min(...ticketPrices) : null)
  const maximum = explicitMaximum ?? (ticketPrices.length ? Math.max(...ticketPrices) : minimum)
  const allTicketsAreFree =
    visibleTickets.length > 0 &&
    visibleTickets.every(
      (ticket) => ticket.type === 'free' || amountFrom(ticket.price) === 0,
    )

  return {
    currency: suppliedCurrency ?? value.currency ?? value.paymentCurrency,
    isFree: value.isFree ?? (allTicketsAreFree ? true : minimum === 0 && maximum === 0),
    maximum,
    minimum,
  }
}

function formatCurrency(amount, currency, locale) {
  const currencyCode = String(currency || 'USD').toUpperCase()

  try {
    return new Intl.NumberFormat(locale, {
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      style: 'currency',
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toLocaleString(locale, { maximumFractionDigits: 2 })}`
  }
}

export function formatPrice(value, currency, { locale = DEFAULT_LOCALE } = {}) {
  const facts = priceFacts(value, currency)

  if (facts.isFree) return 'Free'
  if (facts.minimum == null) return 'Price to be announced'

  const minimumLabel = formatCurrency(facts.minimum, facts.currency, locale)

  if (facts.maximum != null && facts.maximum > facts.minimum) {
    return `${minimumLabel} – ${formatCurrency(facts.maximum, facts.currency, locale)}`
  }

  if (value && typeof value === 'object' && value.minimumPrice != null) {
    return `From ${minimumLabel}`
  }

  return minimumLabel
}

export function formatLocation(value) {
  if (!value) return 'Venue to be announced'

  if (typeof value === 'string') {
    return normalizeWhitespace(value) || 'Venue to be announced'
  }

  if (value.online || value.isOnline) return 'Online event'

  const location = value.location ?? {}
  const label =
    (typeof location === 'string' ? location : location.name ?? location.shortName) ??
    value.locationName ??
    value.searchableLocationName ??
    value.venue

  return normalizeWhitespace(label) || 'Venue to be announced'
}

export function inferCategory(event = {}) {
  const suppliedCategory = normalizeWhitespace(
    event.category ?? event.eventType ?? event.typeName ?? '',
  )
  if (suppliedCategory) return suppliedCategory

  const haystack = [
    event.name,
    event.title,
    event.description,
    event.shortDescription,
    ...(Array.isArray(event.tags) ? event.tags : []),
  ]
    .filter(Boolean)
    .join(' ')

  return CATEGORY_RULES.find(([, rule]) => rule.test(haystack))?.[0] ?? 'Other'
}

export function getEventStatus(event, now = new Date()) {
  const currentTime = toValidDate(now)?.getTime() ?? Date.now()
  const startTime = toValidDate(event?.startsAt ?? event?.startDate)?.getTime()
  const endTime = toValidDate(event?.endsAt ?? event?.endDate)?.getTime()

  if (endTime != null && endTime < currentTime) return 'past'
  if (startTime != null && startTime <= currentTime && (endTime == null || endTime >= currentTime)) {
    return 'ongoing'
  }
  if (startTime != null && startTime > currentTime) return 'upcoming'
  return 'date-tba'
}

function startOfDay(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function selectedDateRange(filter, now) {
  const selection = String(filter || '').toLowerCase()
  const today = startOfDay(now)

  if (!selection || selection === 'all' || selection === 'any') return null
  if (selection === 'upcoming') return [now, null]
  if (selection === 'today') return [today, endOfDay(today)]

  if (selection === 'week' || selection === 'this-week') {
    const end = endOfDay(today)
    end.setDate(end.getDate() + 7)
    return [today, end]
  }

  if (selection === 'weekend') {
    const saturday = startOfDay(today)
    const daysUntilSaturday = (6 - saturday.getDay() + 7) % 7
    saturday.setDate(saturday.getDate() + daysUntilSaturday)
    const sunday = endOfDay(saturday)
    sunday.setDate(sunday.getDate() + 1)
    return [saturday, sunday]
  }

  if (selection === 'month' || selection === 'this-month') {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    return [today, end]
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(selection)) {
    const selected = new Date(`${selection}T00:00:00`)
    if (!Number.isNaN(selected.getTime())) return [selected, endOfDay(selected)]
  }

  return null
}

function includesText(value, query) {
  return String(value ?? '').toLocaleLowerCase().includes(query)
}

export function buildEventSearchText(event) {
  return [
    event?.name,
    event?.title,
    event?.description,
    event?.shortDescription,
    event?.organizer,
    event?.ownerName,
    event?.category,
    formatLocation(event),
    ...(Array.isArray(event?.tags) ? event.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}

/**
 * Client-side search, filters and sorting for already-fetched events.
 * All filter values are optional and the input array is never mutated.
 */
export function searchAndFilterEvents(
  events,
  {
    category = '',
    date = '',
    endDate,
    free,
    location = '',
    online,
    query = '',
    sort = 'date-asc',
    startDate,
  } = {},
) {
  if (!Array.isArray(events)) return []

  const normalizedQuery = normalizeWhitespace(query).toLocaleLowerCase()
  const normalizedLocation = normalizeWhitespace(location).toLocaleLowerCase()
  const normalizedCategory = normalizeWhitespace(category).toLocaleLowerCase()
  const now = new Date()
  const quickRange = selectedDateRange(date, now)
  const rangeStart = toValidDate(startDate) ?? quickRange?.[0] ?? null
  const rangeEnd = toValidDate(endDate) ?? quickRange?.[1] ?? null
  const formatFilter = typeof online === 'string'
    ? ['online', 'in-person', 'hybrid'].includes(online.toLowerCase())
      ? online.toLowerCase()
      : null
    : null
  const onlineFilter = typeof online === 'boolean' ? online : null

  const filtered = events.filter((event) => {
    if (normalizedQuery && !buildEventSearchText(event).includes(normalizedQuery)) return false
    if (normalizedLocation && !includesText(formatLocation(event), normalizedLocation)) return false

    if (
      normalizedCategory &&
      normalizedCategory !== 'all' &&
      !includesText(event.category ?? inferCategory(event), normalizedCategory)
    ) {
      return false
    }

    if (formatFilter) {
      const declaredFormat = normalizeWhitespace(event.format).toLowerCase().replace('_', '-')
      const eventFormat = declaredFormat || (event.online ?? event.isOnline ? 'online' : 'in-person')
      if (eventFormat !== formatFilter) return false
    }
    if (onlineFilter != null && Boolean(event.online ?? event.isOnline) !== onlineFilter) return false
    if (typeof free === 'boolean' && event.isFree !== free) return false

    const eventDate = toValidDate(event.startsAt ?? event.startDate)
    if ((rangeStart || rangeEnd) && !eventDate) return false
    if (rangeStart && eventDate < rangeStart) return false
    if (rangeEnd && eventDate > rangeEnd) return false

    return true
  })

  const direction = sort.endsWith('desc') ? -1 : 1

  return filtered
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      let comparison = 0

      if (sort.startsWith('name')) {
        comparison = String(left.event.name ?? left.event.title ?? '').localeCompare(
          String(right.event.name ?? right.event.title ?? ''),
        )
      } else {
        const leftTime = toValidDate(left.event.startsAt ?? left.event.startDate)?.getTime()
        const rightTime = toValidDate(right.event.startsAt ?? right.event.startDate)?.getTime()
        comparison = (leftTime ?? Number.POSITIVE_INFINITY) - (rightTime ?? Number.POSITIVE_INFINITY)
      }

      return comparison === 0 ? left.index - right.index : comparison * direction
    })
    .map(({ event }) => event)
}

export const filterEvents = searchAndFilterEvents
