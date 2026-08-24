function dateTimeParts(value) {
  const match = String(value ?? '').match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  )
  if (!match) return null

  return {
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    month: Number(match[2]),
    year: Number(match[1]),
  }
}

function partsInZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  })
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  )
}

function offsetAt(timestamp, timeZone) {
  const parts = partsInZone(new Date(timestamp), timeZone)
  const displayedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return displayedAsUtc - Math.floor(timestamp / 1000) * 1000
}

/** Convert an API instant into the wall-clock value expected by datetime-local. */
export function isoToZonedDateTimeLocal(value, timeZone = 'Africa/Nairobi') {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  try {
    const parts = partsInZone(date, timeZone)
    const pad = (number) => String(number).padStart(2, '0')
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
  } catch {
    return ''
  }
}

/** Convert a datetime-local wall clock in an IANA timezone into a UTC ISO instant. */
export function zonedDateTimeLocalToIso(value, timeZone = 'Africa/Nairobi') {
  const parts = dateTimeParts(value)
  if (!parts) return null

  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  )

  try {
    let instant = wallClockAsUtc - offsetAt(wallClockAsUtc, timeZone)
    // Recalculate at the candidate instant so zones with daylight-saving changes
    // use the offset that applies to the selected date.
    instant = wallClockAsUtc - offsetAt(instant, timeZone)
    return new Date(instant).toISOString()
  } catch {
    return null
  }
}
