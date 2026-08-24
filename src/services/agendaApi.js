import { apiRequest } from './apiClient.js'

function unwrap(payload) {
  return payload?.data ?? payload
}

export async function fetchAgenda(eventId, options = {}) {
  const payload = await apiRequest(`/events/${encodeURIComponent(eventId)}/agenda-items`, {
    signal: options.signal,
  })
  return Array.isArray(unwrap(payload)) ? unwrap(payload) : []
}

export async function createAgendaItem(eventId, values) {
  return unwrap(
    await apiRequest(`/events/${encodeURIComponent(eventId)}/agenda-items`, {
      body: values,
      method: 'POST',
    }),
  )
}

export async function updateAgendaItem(itemId, values) {
  return unwrap(
    await apiRequest(`/agenda-items/${encodeURIComponent(itemId)}`, {
      body: values,
      method: 'PATCH',
    }),
  )
}

export async function deleteAgendaItem(itemId) {
  await apiRequest(`/agenda-items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
}
