import { describe, expect, it } from 'vitest'
import {
  isoToZonedDateTimeLocal,
  zonedDateTimeLocalToIso,
} from './dateTime.js'

describe('timezone-aware form conversion', () => {
  it('converts Nairobi wall-clock time to the correct UTC instant', () => {
    expect(
      zonedDateTimeLocalToIso('2026-08-25T09:30', 'Africa/Nairobi'),
    ).toBe('2026-08-25T06:30:00.000Z')
  })

  it('renders a UTC instant in the selected event timezone', () => {
    expect(
      isoToZonedDateTimeLocal('2026-08-25T06:30:00.000Z', 'Africa/Nairobi'),
    ).toBe('2026-08-25T09:30')
    expect(
      isoToZonedDateTimeLocal('2026-08-25T06:30:00.000Z', 'UTC'),
    ).toBe('2026-08-25T06:30')
  })

  it('rejects malformed values instead of silently changing the date', () => {
    expect(zonedDateTimeLocalToIso('not-a-date', 'Africa/Nairobi')).toBeNull()
    expect(isoToZonedDateTimeLocal('not-a-date', 'Africa/Nairobi')).toBe('')
  })
})
