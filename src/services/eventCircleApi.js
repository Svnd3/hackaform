import { apiRequest } from './apiClient.js'

function unwrap(payload) {
  return payload?.data ?? payload
}

export function normalizeEventCircle(circle) {
  if (!circle || typeof circle !== 'object') return null

  return {
    ...circle,
    createdAt: circle.createdAt ?? circle.created_at ?? null,
    eventId: circle.eventId ?? circle.event_id ?? null,
    inviteUrl: circle.inviteUrl ?? circle.invite_url ?? '',
    updatedAt: circle.updatedAt ?? circle.updated_at ?? null,
    welcomeMessage: circle.welcomeMessage ?? circle.welcome_message ?? '',
  }
}

function circlePath(eventId) {
  return `/events/${encodeURIComponent(eventId)}/circle`
}

export async function fetchEventCircle(eventId, { signal } = {}) {
  return normalizeEventCircle(unwrap(await apiRequest(circlePath(eventId), { signal })))
}

export async function createEventCircle(eventId, values) {
  return normalizeEventCircle(unwrap(await apiRequest(circlePath(eventId), {
    body: values,
    method: 'POST',
  })))
}

export async function updateEventCircle(eventId, values) {
  return normalizeEventCircle(unwrap(await apiRequest(circlePath(eventId), {
    body: values,
    method: 'PATCH',
  })))
}

export async function deleteEventCircle(eventId) {
  await apiRequest(circlePath(eventId), { method: 'DELETE' })
}
