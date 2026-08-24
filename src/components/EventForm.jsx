import { CalendarDays, Image, MapPin, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { EVENT_CATEGORIES } from '../data/categories.js'
import {
  isoToZonedDateTimeLocal,
  zonedDateTimeLocalToIso,
} from '../utils/dateTime.js'
import InlineNotice from './InlineNotice.jsx'

function initialValues(event) {
  const timezone = event?.timezone ?? 'Africa/Nairobi'
  return {
    capacity: event?.capacity ?? 50,
    category: event?.category ?? 'Technology',
    city: event?.city ?? 'Nairobi',
    description: event?.description ?? '',
    endAt: isoToZonedDateTimeLocal(event?.endAt ?? event?.endsAt, timezone),
    format: event?.format ?? 'in-person',
    imageUrl: event?.imageUrl ?? '',
    startAt: isoToZonedDateTimeLocal(event?.startAt ?? event?.startsAt, timezone),
    status: event?.status === 'upcoming' ? 'published' : event?.status ?? 'draft',
    timezone,
    title: event?.name ?? event?.title ?? '',
    venue: event?.venue ?? '',
  }
}

function validate(values) {
  const fields = {}
  if (values.title.trim().length < 4) fields.title = 'Use at least four characters.'
  if (values.description.trim().length < 20) fields.description = 'Give attendees at least 20 characters of useful detail.'
  if (!values.startAt) fields.startAt = 'Choose a starting date and time.'
  if (!values.endAt) fields.endAt = 'Choose an ending date and time.'
  if (values.startAt && values.endAt && new Date(values.endAt) <= new Date(values.startAt)) {
    fields.endAt = 'The end must come after the start.'
  }
  if (values.format !== 'online' && !values.city.trim()) fields.city = 'Add the event city.'
  if (values.format !== 'online' && !values.venue.trim()) fields.venue = 'Add a venue or area.'
  if (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) < 1) {
    fields.capacity = 'Capacity must be at least one.'
  }
  return fields
}

export default function EventForm({ event, error, onSubmit, submitting = false }) {
  const [values, setValues] = useState(() => initialValues(event))
  const [fields, setFields] = useState({})

  function update(field, nextValue) {
    setValues((current) => ({ ...current, [field]: nextValue }))
    setFields((current) => ({ ...current, [field]: undefined }))
  }

  function submit(formEvent) {
    formEvent.preventDefault()
    const nextFields = validate(values)
    setFields(nextFields)
    if (Object.keys(nextFields).length) return

    onSubmit({
      ...values,
      capacity: Number(values.capacity),
      city: values.format === 'online' ? 'Online' : values.city.trim(),
      description: values.description.trim(),
      endAt: zonedDateTimeLocalToIso(values.endAt, values.timezone),
      format: values.format === 'in-person' ? 'in_person' : values.format,
      imageUrl: values.imageUrl.trim() || null,
      startAt: zonedDateTimeLocalToIso(values.startAt, values.timezone),
      title: values.title.trim(),
      venue: values.format === 'online' ? '' : values.venue.trim(),
    })
  }

  return (
    <form className="event-form" noValidate onSubmit={submit}>
      {error && <InlineNotice>{error.message || 'The event could not be saved.'}</InlineNotice>}

      <section className="form-section">
        <div className="form-section__heading"><span>01</span><div><p className="eyebrow">The invitation</p><h2>What are people showing up for?</h2></div></div>
        <div className="form-grid">
          <label className="form-field form-field--wide">
            <span>Event title</span>
            <input autoFocus maxLength="120" onChange={(input) => update('title', input.target.value)} placeholder="Nairobi Creative Coding Night" required value={values.title} />
            {fields.title && <small className="field-error">{fields.title}</small>}
          </label>
          <label className="form-field">
            <span>Category</span>
            <select onChange={(input) => update('category', input.target.value)} value={values.category}>
              {EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Visibility</span>
            <select onChange={(input) => update('status', input.target.value)} value={values.status}>
              <option value="draft">Draft — only you can see it</option>
              <option value="published">Published — open for bookings</option>
              {event && <option value="cancelled">Cancelled</option>}
            </select>
          </label>
          <label className="form-field form-field--wide">
            <span>Description</span>
            <textarea maxLength="3000" onChange={(input) => update('description', input.target.value)} placeholder="Tell attendees what they will learn, make, or experience." required rows="6" value={values.description} />
            <small className={fields.description ? 'field-error' : ''}>{fields.description ?? `${values.description.length}/3000 characters`}</small>
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section__heading"><span>02</span><div><p className="eyebrow">Time and place</p><h2>Make the plan concrete.</h2></div></div>
        <div className="form-grid">
          <fieldset className="format-choice form-field--wide">
            <legend>Event format</legend>
            <label className={values.format === 'in-person' ? 'format-choice__active' : ''}><input checked={values.format === 'in-person'} name="format" onChange={() => update('format', 'in-person')} type="radio" /><MapPin aria-hidden="true" /> In person</label>
            <label className={values.format === 'online' ? 'format-choice__active' : ''}><input checked={values.format === 'online'} name="format" onChange={() => update('format', 'online')} type="radio" /><CalendarDays aria-hidden="true" /> Online</label>
            <label className={values.format === 'hybrid' ? 'format-choice__active' : ''}><input checked={values.format === 'hybrid'} name="format" onChange={() => update('format', 'hybrid')} type="radio" /><UsersRound aria-hidden="true" /> Hybrid</label>
          </fieldset>
          {values.format !== 'online' && (
            <>
              <label className="form-field"><span>City</span><input onChange={(input) => update('city', input.target.value)} placeholder="Nairobi" value={values.city} />{fields.city && <small className="field-error">{fields.city}</small>}</label>
              <label className="form-field"><span>Venue or area</span><input onChange={(input) => update('venue', input.target.value)} placeholder="Nairobi Garage, Kilimani" value={values.venue} />{fields.venue && <small className="field-error">{fields.venue}</small>}</label>
            </>
          )}
          <label className="form-field"><span>Starts</span><input onChange={(input) => update('startAt', input.target.value)} required type="datetime-local" value={values.startAt} />{fields.startAt && <small className="field-error">{fields.startAt}</small>}</label>
          <label className="form-field"><span>Ends</span><input onChange={(input) => update('endAt', input.target.value)} required type="datetime-local" value={values.endAt} />{fields.endAt && <small className="field-error">{fields.endAt}</small>}</label>
          <label className="form-field"><span>Timezone</span><select onChange={(input) => update('timezone', input.target.value)} value={values.timezone}><option value="Africa/Nairobi">East Africa Time (EAT)</option><option value="UTC">Coordinated Universal Time (UTC)</option></select></label>
          <label className="form-field"><span>Capacity</span><div className="form-field__control"><UsersRound size={18} aria-hidden="true" /><input min="1" onChange={(input) => update('capacity', input.target.value)} required type="number" value={values.capacity} /></div>{fields.capacity && <small className="field-error">{fields.capacity}</small>}</label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section__heading"><span>03</span><div><p className="eyebrow">The poster</p><h2>Give it a face.</h2></div></div>
        <label className="form-field">
          <span>Image URL <small>optional</small></span>
          <div className="form-field__control"><Image size={18} aria-hidden="true" /><input onChange={(input) => update('imageUrl', input.target.value)} placeholder="https://…" type="url" value={values.imageUrl} /></div>
          <small>Leave blank and Hackaform will create a colorful fallback.</small>
        </label>
      </section>

      <div className="event-form__submit">
        <div><strong>{values.status === 'published' ? 'Ready to meet your crowd?' : 'Still shaping the idea?'}</strong><small>{values.status === 'published' ? 'Publishing makes this event bookable.' : 'Save a draft and return whenever you are ready.'}</small></div>
        <button className="button button--primary button--large" disabled={submitting} type="submit">{submitting ? 'Saving event…' : event ? 'Save event changes' : values.status === 'published' ? 'Publish event' : 'Save draft'}</button>
      </div>
    </form>
  )
}
