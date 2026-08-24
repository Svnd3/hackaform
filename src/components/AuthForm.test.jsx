import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth.js'
import AuthForm from './AuthForm.jsx'

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

const login = vi.fn()
const register = vi.fn()

function renderForm(mode = 'login', entry = `/${mode}`) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route path="/schedule" element={<h1>My schedule</h1>} />
        <Route path="/organizer" element={<h1>Organizer studio</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthForm', () => {
  beforeEach(() => {
    login.mockReset()
    register.mockReset()
    useAuth.mockReturnValue({ login, register })
  })

  it('normalizes credentials and returns a signed-in user to the protected destination', async () => {
    const user = userEvent.setup()
    login.mockResolvedValue({ id: 7, name: 'Amina' })
    renderForm('login', {
      pathname: '/login',
      state: { from: { pathname: '/organizer' } },
    })

    await user.type(screen.getByRole('textbox', { name: /email address/i }), '  AMINA@EXAMPLE.COM  ')
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(login).toHaveBeenCalledWith({
      email: 'amina@example.com',
      password: 'StrongPass123',
    })
    expect(await screen.findByRole('heading', { name: 'Organizer studio' })).toBeInTheDocument()
  })

  it('stops an invalid registration locally and shows field-level guidance', async () => {
    const user = userEvent.setup()
    renderForm('register')

    await user.type(screen.getByRole('textbox', { name: /^name$/i }), 'A')
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'a@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.click(screen.getByRole('button', { name: /create my account/i }))

    expect(screen.getByText(/tell us what to call you/i)).toBeInTheDocument()
    expect(screen.getByText(/use at least two characters/i)).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('surfaces an authentication failure and lets the user reveal their password', async () => {
    const user = userEvent.setup()
    login.mockRejectedValue({ message: 'Email or password is incorrect.' })
    renderForm()

    const password = screen.getByLabelText(/^password$/i)
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'amina@example.com')
    await user.type(password, 'StrongPass123')
    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText('Email or password is incorrect.')).toBeInTheDocument()
  })
})
