import { describe, expect, it } from 'vitest'
import {
  formatLocation,
  inferCategory,
  searchAndFilterEvents,
  stripHtml,
} from './eventUtils.js'

const events = [
  {
    category: 'Hackathon',
    description: 'Build useful tools with a team',
    id: '1',
    locationName: 'Nairobi Garage',
    name: 'Nairobi Climate Hackathon',
    online: false,
    startsAt: '2030-06-14T09:00:00.000Z',
  },
  {
    category: 'Education',
    description: 'A practical frontend class',
    id: '2',
    name: 'React Workshop',
    online: true,
    startsAt: '2030-05-02T12:00:00.000Z',
  },
]

describe('event utilities', () => {
  it('turns untrusted API markup into safe plain text', () => {
    expect(stripHtml('<p>Hello <strong>builders</strong></p><script>alert(1)</script>')).toBe(
      'Hello builders',
    )
  })

  it('infers a useful category from event content', () => {
    expect(inferCategory({ name: 'Open-source code jam' })).toBe('Hackathon')
    expect(inferCategory({ name: 'Founder networking breakfast' })).toBe('Business')
  })

  it('searches, filters and sorts without mutating the source list', () => {
    const original = [...events]
    const result = searchAndFilterEvents(events, {
      category: 'Hackathon',
      location: 'Nairobi',
      query: 'climate',
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(events).toEqual(original)
  })

  it('provides clear online and missing-venue labels', () => {
    expect(formatLocation({ online: true })).toBe('Online event')
    expect(formatLocation({})).toBe('Venue to be announced')
  })
})
