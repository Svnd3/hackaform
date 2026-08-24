import { apiRequest, queryString } from './apiClient.js'
import { normalizeEvent } from './eventsApi.js'

function unwrap(payload) {
  return payload?.data ?? payload
}

export function normalizeBooking(booking) {
  if (!booking || typeof booking !== 'object') return null
  return {
    ...booking,
    event: booking.event ? normalizeEvent(booking.event) : null,
    eventId: booking.eventId ?? booking.event_id,
    quantity: Number(booking.quantity) || 1,
    status: booking.status || 'confirmed',
    userId: booking.userId ?? booking.user_id,
  }
}

export async function fetchBookings({ signal } = {}) {
  const payload = await apiRequest('/bookings', { signal })
  return (Array.isArray(unwrap(payload)) ? unwrap(payload) : [])
    .map(normalizeBooking)
    .filter(Boolean)
}

export async function fetchBooking(bookingId, { signal } = {}) {
  return normalizeBooking(unwrap(
    await apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, { signal }),
  ))
}

export async function createBooking(values) {
  return normalizeBooking(unwrap(await apiRequest('/bookings', { body: values, method: 'POST' })))
}

export async function updateBooking(bookingId, values) {
  return normalizeBooking(unwrap(
    await apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, {
      body: values,
      method: 'PATCH',
    }),
  ))
}

export async function deleteBooking(bookingId) {
  await apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
}

export async function fetchEventBookings(eventId, { page = 1, perPage = 50, signal } = {}) {
  const payload = await apiRequest(
    `/events/${encodeURIComponent(eventId)}/bookings${queryString({ page, perPage })}`,
    { signal },
  )
  return {
    bookings: (Array.isArray(unwrap(payload)) ? unwrap(payload) : [])
      .map(normalizeBooking)
      .filter(Boolean),
    meta: payload?.meta ?? {},
  }
}
