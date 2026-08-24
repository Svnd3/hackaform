import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createAgendaItem,
  deleteAgendaItem,
  fetchAgenda,
  updateAgendaItem,
} from '../services/agendaApi.js'
import {
  isoToZonedDateTimeLocal,
  zonedDateTimeLocalToIso,
} from '../utils/dateTime.js'
import { formatEventDate } from '../utils/eventUtils.js'
import ConfirmAction from './ConfirmAction.jsx'
import InlineNotice from './InlineNotice.jsx'

const BLANK_ITEM = { description: '', endsAt: '', position: 1, speaker: '', startsAt: '', title: '' }

export default function AgendaManager({ eventId, timezone = 'Africa/Nairobi' }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [values, setValues] = useState(BLANK_ITEM)

  const load = useCallback((signal) => {
    return fetchAgenda(eventId, { signal })
      .then((result) => {
        setItems(result.sort((left, right) => left.position - right.position))
        setValues((current) => ({ ...current, position: result.length + 1 }))
        setStatus('ready')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError)
          setStatus('error')
        }
      })
  }, [eventId])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  function edit(item) {
    setEditing(item.id)
    setValues({
      description: item.description ?? '',
      endsAt: isoToZonedDateTimeLocal(item.endsAt, timezone),
      position: item.position,
      speaker: item.speaker ?? '',
      startsAt: isoToZonedDateTimeLocal(item.startsAt, timezone),
      title: item.title,
    })
  }

  function resetForm() {
    setEditing(null)
    setValues({ ...BLANK_ITEM, position: items.length + 1 })
  }

  async function save(formEvent) {
    formEvent.preventDefault()
    setStatus('saving')
    setError(null)
    const payload = {
      ...values,
      description: values.description.trim(),
      endsAt: values.endsAt ? zonedDateTimeLocalToIso(values.endsAt, timezone) : null,
      position: Number(values.position),
      speaker: values.speaker.trim(),
      startsAt: values.startsAt ? zonedDateTimeLocalToIso(values.startsAt, timezone) : null,
      title: values.title.trim(),
    }
    try {
      const saved = editing
        ? await updateAgendaItem(editing, payload)
        : await createAgendaItem(eventId, payload)
      const nextItems = (
        editing
          ? items.map((item) => item.id === saved.id ? saved : item)
          : [...items, saved]
      ).sort((left, right) => left.position - right.position)
      setItems(nextItems)
      setEditing(null)
      setValues({ ...BLANK_ITEM, position: nextItems.length + 1 })
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  async function remove(itemId) {
    setStatus('saving')
    setError(null)
    try {
      await deleteAgendaItem(itemId)
      setItems((current) => current.filter((item) => item.id !== itemId))
      setConfirming(null)
      if (editing === itemId) resetForm()
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  return (
    <section className="agenda-manager" aria-labelledby="agenda-manager-title">
      <div className="agenda-manager__heading">
        <div><p className="eyebrow">Build the day</p><h2 id="agenda-manager-title">Event agenda.</h2><p>Turn a promising event into a plan people can trust.</p></div>
        <span><CalendarClock aria-hidden="true" /></span>
      </div>

      {error && <InlineNotice>{error.message}</InlineNotice>}

      {status === 'loading' ? (
        <div className="agenda-loading" role="status">Loading the agenda…</div>
      ) : (
        <div className="agenda-manager__grid">
          <div className="agenda-list">
            {items.length ? items.map((item, index) => (
              <article className="agenda-item" key={item.id}>
                <span className="agenda-item__number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <time>{item.startsAt ? formatEventDate(item.startsAt, { includeYear: false, timeZone: timezone }) : 'Time TBA'}</time>
                  <h3>{item.title}</h3>
                  {item.speaker && <p>With {item.speaker}</p>}
                  {item.description && <small>{item.description}</small>}
                </div>
                <div className="agenda-item__actions">
                  <button aria-label={`Edit ${item.title}`} onClick={() => edit(item)} type="button"><Pencil size={15} /></button>
                  <button aria-label={`Delete ${item.title}`} onClick={() => setConfirming(item.id)} type="button"><Trash2 size={15} /></button>
                </div>
                {confirming === item.id && <ConfirmAction busy={status === 'saving'} confirmLabel="Delete item" message={`Delete “${item.title}”?`} onCancel={() => setConfirming(null)} onConfirm={() => remove(item.id)} />}
              </article>
            )) : (
              <div className="agenda-empty"><CalendarClock size={28} /><h3>No agenda items yet.</h3><p>Add the first moment of the day using the form.</p></div>
            )}
          </div>

          <form className="agenda-form" onSubmit={save}>
            <div className="agenda-form__title"><span><Plus size={18} /></span><div><p className="eyebrow">{editing ? 'Editing an item' : 'Add to the programme'}</p><h3>{editing ? 'Refine this moment.' : 'What happens next?'}</h3></div></div>
            <label className="form-field"><span>Title</span><input onChange={(input) => setValues((current) => ({ ...current, title: input.target.value }))} placeholder="Opening remarks" required value={values.title} /></label>
            <label className="form-field"><span>Speaker <small>optional</small></span><input onChange={(input) => setValues((current) => ({ ...current, speaker: input.target.value }))} placeholder="Amina Kamau" value={values.speaker} /></label>
            <div className="agenda-form__row"><label className="form-field"><span>Starts</span><input onChange={(input) => setValues((current) => ({ ...current, startsAt: input.target.value }))} required type="datetime-local" value={values.startsAt} /></label><label className="form-field"><span>Ends</span><input onChange={(input) => setValues((current) => ({ ...current, endsAt: input.target.value }))} required type="datetime-local" value={values.endsAt} /></label></div>
            <label className="form-field"><span>Position</span><input min="1" onChange={(input) => setValues((current) => ({ ...current, position: input.target.value }))} required type="number" value={values.position} /></label>
            <label className="form-field"><span>Description <small>optional</small></span><textarea maxLength="1000" onChange={(input) => setValues((current) => ({ ...current, description: input.target.value }))} rows="3" value={values.description} /></label>
            <button className="button button--dark button--full" disabled={status === 'saving'} type="submit">{status === 'saving' ? 'Saving…' : editing ? 'Update agenda item' : 'Add agenda item'}</button>
            {editing && <button className="agenda-form__cancel" disabled={status === 'saving'} onClick={resetForm} type="button">Cancel editing</button>}
          </form>
        </div>
      )}
    </section>
  )
}
