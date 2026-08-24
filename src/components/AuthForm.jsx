import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import InlineNotice from './InlineNotice.jsx'

export default function AuthForm({ mode = 'login' }) {
  const registering = mode === 'register'
  const { login, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', name: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const destination = location.state?.from?.pathname || '/schedule'

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (registering && values.name.trim().length < 2) {
      setError({ fields: { name: 'Use at least two characters.' }, message: 'Tell us what to call you.' })
      return
    }
    if (values.password.length < 8) {
      setError({ fields: { password: 'Use at least eight characters.' }, message: 'Your password is too short.' })
      return
    }

    setSubmitting(true)
    try {
      if (registering) {
        await register({
          email: values.email.trim().toLowerCase(),
          name: values.name.trim(),
          password: values.password,
        })
      } else {
        await login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        })
      }
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`auth-page auth-page--${mode}`}>
      <div className="auth-page__art" aria-hidden="true">
        <span className="auth-page__orb" />
        <p>{registering ? 'MAKE PLANS.\nKEEP PLANS.' : 'YOUR NEXT\nGOOD ROOM.'}</p>
        <small>NAIROBI · EAST AFRICA · ONLINE</small>
      </div>

      <section className="auth-card" aria-labelledby={`${mode}-title`}>
        <p className="eyebrow">{registering ? 'Join the community' : 'Welcome back'}</p>
        <h1 id={`${mode}-title`}>
          {registering ? 'Make showing up a habit.' : 'Pick up where you left off.'}
        </h1>
        <p className="auth-card__lede">
          {registering
            ? 'Create an account to book events, keep a schedule, and publish your own gatherings.'
            : 'Sign in to manage your bookings, event plans, and organizer workspace.'}
        </p>

        {error && <InlineNotice>{error.message || 'Something went wrong. Please try again.'}</InlineNotice>}

        <form className="form-stack" onSubmit={handleSubmit}>
          {registering && (
            <label className="form-field">
              <span>Name</span>
              <div className="form-field__control">
                <UserRound size={18} aria-hidden="true" />
                <input
                  autoComplete="name"
                  autoFocus
                  name="name"
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Your name"
                  required
                  value={values.name}
                />
              </div>
              {error?.fields?.name && <small className="field-error">{error.fields.name}</small>}
            </label>
          )}

          <label className="form-field">
            <span>Email address</span>
            <div className="form-field__control">
              <Mail size={18} aria-hidden="true" />
              <input
                autoComplete="email"
                autoFocus={!registering}
                name="email"
                onChange={(event) => update('email', event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={values.email}
              />
            </div>
            {error?.fields?.email && <small className="field-error">{error.fields.email}</small>}
          </label>

          <label className="form-field">
            <span>Password</span>
            <div className="form-field__control">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                autoComplete={registering ? 'new-password' : 'current-password'}
                name="password"
                onChange={(event) => update('password', event.target.value)}
                placeholder={registering ? 'At least 8 characters' : 'Your password'}
                required
                type={showPassword ? 'text' : 'password'}
                value={values.password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error?.fields?.password && <small className="field-error">{error.fields.password}</small>}
          </label>

          <button className="button button--primary button--large button--full" disabled={submitting} type="submit">
            {submitting ? 'Opening your workspace…' : registering ? 'Create my account' : 'Sign in'}
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="auth-card__switch">
          {registering ? 'Already part of Hackaform?' : 'New around here?'}{' '}
          <Link replace state={location.state} to={registering ? '/login' : '/register'}>
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </div>
  )
}

