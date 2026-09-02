import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createEventCircle,
  deleteEventCircle,
  fetchEventCircle,
  updateEventCircle,
} from '../services/eventCircleApi.js'
import { downloadEventCircleCover } from '../utils/eventCircleCover.js'
import ConfirmAction from './ConfirmAction.jsx'
import InlineNotice from './InlineNotice.jsx'

function defaultMessage(event) {
  return `Welcome to the ${event.name} attendee circle. Introduce yourself, share what you hope to learn, and keep event-day planning in this group.`
}

export default function EventCircleManager({ event }) {
  const [circle, setCircle] = useState(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState(() => defaultMessage(event))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchEventCircle(event.id, { signal: controller.signal })
      .then((result) => {
        setCircle(result)
        setInviteUrl(result?.inviteUrl ?? '')
        setWelcomeMessage(result?.welcomeMessage || defaultMessage(event))
        setStatus('ready')
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (requestError.status === 404) {
          setStatus('ready')
          return
        }
        setError(requestError)
        setStatus('error')
      })
    return () => controller.abort()
  }, [event])

  async function save(formEvent) {
    formEvent.preventDefault()
    setStatus('saving')
    setError(null)
    setNotice(null)
    const values = { inviteUrl: inviteUrl.trim(), welcomeMessage: welcomeMessage.trim() }
    try {
      const saved = circle
        ? await updateEventCircle(event.id, values)
        : await createEventCircle(event.id, values)
      setCircle(saved)
      setInviteUrl(saved.inviteUrl)
      setWelcomeMessage(saved.welcomeMessage || '')
      setNotice(circle ? 'Attendee circle updated.' : 'Attendee circle is now open to confirmed guests.')
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  async function remove() {
    setStatus('saving')
    setError(null)
    try {
      await deleteEventCircle(event.id)
      setCircle(null)
      setInviteUrl('')
      setWelcomeMessage(defaultMessage(event))
      setConfirming(false)
      setNotice('Attendee circle closed. The invite is no longer visible on Hackaform.')
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  async function copyMessage() {
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(welcomeMessage)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function downloadCover() {
    setError(null)
    try {
      await downloadEventCircleCover(event)
    } catch (coverError) {
      setError(coverError)
    }
  }

  return (
    <section className="circle-manager" aria-labelledby="circle-manager-title">
      <div className="circle-manager__heading">
        <div>
          <p className="eyebrow">Meet before the meetup</p>
          <h2 id="circle-manager-title">Open an attendee circle.</h2>
          <p>Give confirmed guests a private place to introduce themselves and coordinate before the event.</p>
        </div>
        <span><MessageCircle aria-hidden="true" /></span>
      </div>

      <div className="circle-manager__layout">
        <div className="circle-setup-card">
          <div className="circle-setup-card__topline">
            <span>{circle ? 'Circle live' : 'Three-step setup'}</span>
            {circle && <strong><span aria-hidden="true" /> Confirmed guests only</strong>}
          </div>
          <ol className="circle-steps">
            <li><span>01</span><div><strong>Create the group in WhatsApp</strong><p>WhatsApp keeps group ownership and moderation in your hands.</p></div></li>
            <li><span>02</span><div><strong>Make it feel like this event</strong><p>Download the square cover, then set it as the group photo in WhatsApp.</p><button className="circle-tool-button" onClick={downloadCover} type="button"><Download size={16} /> Download event cover</button></div></li>
            <li><span>03</span><div><strong>Paste the private invite below</strong><p>Hackaform reveals it only to you and confirmed attendees.</p></div></li>
          </ol>
          <div className="circle-safety-note"><ShieldCheck aria-hidden="true" /><p><strong>No auto-creation claim.</strong> WhatsApp requires the organizer to create the group and set its photo inside WhatsApp. Hackaform provides the secure access layer and setup kit.</p></div>
        </div>

        <form className="circle-form" onSubmit={save}>
          <div className="circle-form__title">
            <span><Link2 size={18} /></span>
            <div><p className="eyebrow">Private access</p><h3>{circle ? 'Keep the circle current.' : 'Connect the room.'}</h3></div>
          </div>
          {notice && <InlineNotice kind="success">{notice}</InlineNotice>}
          {error && <InlineNotice>{error.message}</InlineNotice>}
          {status === 'loading' ? (
            <div className="circle-form__loading" role="status">Checking circle settings…</div>
          ) : (
            <>
              <label className="form-field">
                <span>WhatsApp group invite</span>
                <input
                  autoComplete="off"
                  maxLength="500"
                  onChange={(input) => setInviteUrl(input.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  required
                  type="url"
                  value={inviteUrl}
                />
                <small>Use the invite link from Group info → Invite via link.</small>
              </label>
              <label className="form-field">
                <span>Welcome note <small>optional</small></span>
                <textarea maxLength="500" onChange={(input) => setWelcomeMessage(input.target.value)} rows="5" value={welcomeMessage} />
              </label>
              <button className="circle-copy-button" disabled={!welcomeMessage || status === 'saving'} onClick={copyMessage} type="button">
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy note for WhatsApp'}
              </button>
              <button className="button button--dark button--full" disabled={status === 'saving'} type="submit">
                {status === 'saving' ? 'Saving…' : circle ? 'Update attendee circle' : 'Open attendee circle'}
              </button>
              {circle && (
                <>
                  <a className="circle-open-link" href={circle.inviteUrl} rel="noopener noreferrer" target="_blank">Preview invite in WhatsApp <ExternalLink size={15} /></a>
                  {confirming ? (
                    <ConfirmAction busy={status === 'saving'} confirmLabel="Close circle" message="Remove this invite from Hackaform?" onCancel={() => setConfirming(false)} onConfirm={remove} />
                  ) : (
                    <button className="circle-delete-button" onClick={() => setConfirming(true)} type="button"><Trash2 size={15} /> Close attendee circle</button>
                  )}
                </>
              )}
            </>
          )}
        </form>
      </div>
    </section>
  )
}
