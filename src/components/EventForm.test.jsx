import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventForm from './EventForm.jsx'

describe('EventForm', () => {
  it('shows useful client-side errors before sending an incomplete event', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    expect(screen.getByText(/use at least four characters/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('labels the principal event fields accessibly', () => {
    render(<EventForm onSubmit={() => {}} />)
    expect(screen.getByRole('textbox', { name: /event title/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^description/i })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /capacity/i })).toBeInTheDocument()
  })

  it('supports in-person, online, and hybrid event formats', () => {
    render(<EventForm onSubmit={() => {}} />)

    expect(screen.getByRole('radio', { name: /in person/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /online/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /hybrid/i })).toBeInTheDocument()
  })
})
