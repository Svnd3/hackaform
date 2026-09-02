import { ArrowRight, Copy, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { fetchEventCircle } from '../services/eventCircleApi.js'
import InlineNotice from './InlineNotice.jsx'

export default function EventCirclePanel({ event, refreshKey = 0 }) {
  const { authenticated, user } = useAuth()
  const location = useLocation()
  const owner = String(event.ownerId) === String(user?.id)
  const requestToken = `${user?.id ?? 'guest'}:${event.id}:${refreshKey}`
  const [result, setResult] = useState({ circle: null, requestToken: null, status: 'loading' })
  const [copied, setCopied] = useState(false)
  const currentResult = result.requestToken === requestToken
    ? result
    : { circle: null, status: authenticated && !owner ? 'loading' : 'locked' }
  const { circle, status } = currentResult

  useEffect(() => {
    if (!authenticated || owner) return undefined
    const controller = new AbortController()
    fetchEventCircle(event.id, { signal: controller.signal })
      .then((result) => {
        setResult({ circle: result, requestToken, status: 'ready' })
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setResult({
          circle: null,
          requestToken,
          status: requestError.status === 404 ? 'waiting' : requestError.status === 403 ? 'locked' : 'error',
        })
      })
    return () => controller.abort()
  }, [authenticated, event.id, owner, requestToken])

  async function copyWelcome() {
    if (!circle?.welcomeMessage || !navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(circle.welcomeMessage)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (owner) {
    return (
      <section className="event-circle event-circle--owner" aria-labelledby="event-circle-title">
        <span className="event-circle__icon"><MessageCircle aria-hidden="true" /></span>
        <div className="event-circle__copy">
          <p className="eyebrow">Meet before the meetup</p>
          <h2 id="event-circle-title">Help this room arrive connected.</h2>
          <p>Set up a private attendee circle from your event editor. Only you and confirmed guests can access its invite.</p>
        </div>
        <Link className="button button--dark" to={`/organizer/events/${event.id}/edit`}>Manage circle <ArrowRight size={17} /></Link>
      </section>
    )
  }

  if (!authenticated) {
    return (
      <section className="event-circle event-circle--locked" aria-labelledby="event-circle-title">
        <span className="event-circle__icon"><LockKeyhole aria-hidden="true" /></span>
        <div className="event-circle__copy">
          <p className="eyebrow">Booked guests only</p>
          <h2 id="event-circle-title">{event.hasCircle ? 'The conversation starts early.' : 'A better room starts before arrival.'}</h2>
          <p>{event.hasCircle ? 'Book a place to unlock the private attendee circle, meet people going, and plan before event day.' : 'Once the host opens an attendee circle, confirmed guests will find the private invitation here.'}</p>
        </div>
        <Link className="button button--ghost" state={{ from: location }} to="/login">Sign in <ArrowRight size={17} /></Link>
      </section>
    )
  }

  if (status === 'loading') {
    return <section className="event-circle event-circle--loading" aria-live="polite"><div className="skeleton skeleton--title" /><div className="skeleton skeleton--line" /><span className="sr-only">Checking attendee circle access…</span></section>
  }

  if (status === 'locked') {
    return (
      <section className="event-circle event-circle--locked" aria-labelledby="event-circle-title">
        <span className="event-circle__icon"><LockKeyhole aria-hidden="true" /></span>
        <div className="event-circle__copy"><p className="eyebrow">Private by design</p><h2 id="event-circle-title">{event.hasCircle ? 'Book first. Then say hello.' : 'Your host shapes the room.'}</h2><p>{event.hasCircle ? 'The invite stays hidden until your booking is confirmed. That keeps the group relevant and safer for attendees.' : 'When an attendee circle opens, only confirmed guests will be able to see its invite.'}</p></div>
        <ShieldCheck className="event-circle__shield" aria-label="Invite protected" />
      </section>
    )
  }

  if (status === 'waiting') {
    return (
      <section className="event-circle event-circle--waiting" aria-labelledby="event-circle-title">
        <span className="event-circle__icon"><MessageCircle aria-hidden="true" /></span>
        <div className="event-circle__copy"><p className="eyebrow">You have access</p><h2 id="event-circle-title">The host is opening the room soon.</h2><p>Your booking is confirmed. This private space will appear here when the organizer adds the group invite.</p></div>
      </section>
    )
  }

  if (status === 'error') {
    return <section className="event-circle"><InlineNotice>We couldn’t check the attendee circle. Refresh the page to try again.</InlineNotice></section>
  }

  return (
    <section className="event-circle event-circle--open" aria-labelledby="event-circle-title">
      <span className="event-circle__icon"><MessageCircle aria-hidden="true" /></span>
      <div className="event-circle__copy">
        <p className="eyebrow">Your booking unlocked this</p>
        <h2 id="event-circle-title">Meet your people before the doors open.</h2>
        <p>{circle?.welcomeMessage || 'Join the private attendee circle to introduce yourself and coordinate before event day.'}</p>
        {circle?.welcomeMessage && <button className="event-circle__copy-button" onClick={copyWelcome} type="button"><Copy size={15} /> {copied ? 'Welcome note copied' : 'Copy welcome note'}</button>}
      </div>
      <a className="button event-circle__join" href={circle.inviteUrl} rel="noopener noreferrer" target="_blank">Join WhatsApp circle <ArrowRight size={17} /></a>
    </section>
  )
}
