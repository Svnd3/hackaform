import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAgendaItem,
  deleteAgendaItem,
  fetchAgenda,
  updateAgendaItem,
} from '../services/agendaApi.js'
import AgendaManager from './AgendaManager.jsx'

vi.mock('../services/agendaApi.js', () => ({
  createAgendaItem: vi.fn(),
  deleteAgendaItem: vi.fn(),
  fetchAgenda: vi.fn(),
  updateAgendaItem: vi.fn(),
}))

const firstItem = {
  description: 'Set the scene for the day.',
  endsAt: '2026-09-18T07:30:00.000Z',
  id: 10,
  position: 1,
  speaker: 'Amina Kamau',
  startsAt: '2026-09-18T07:00:00.000Z',
  title: 'Opening remarks',
}

describe('AgendaManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchAgenda.mockResolvedValue([firstItem])
  })

  it('creates a trimmed, positioned agenda item and adds it to the programme', async () => {
    const user = userEvent.setup()
    const created = {
      description: 'A practical build session.',
      endsAt: '2026-09-18T09:00:00.000Z',
      id: 11,
      position: 2,
      speaker: 'Otieno Kimani',
      startsAt: '2026-09-18T08:00:00.000Z',
      title: 'Build lab',
    }
    createAgendaItem.mockResolvedValue(created)
    render(<AgendaManager eventId={42} />)

    await screen.findByRole('heading', { name: 'Opening remarks' })
    await user.type(screen.getByRole('textbox', { name: /^title$/i }), '  Build lab  ')
    await user.type(screen.getByRole('textbox', { name: /speaker/i }), '  Otieno Kimani  ')
    await user.type(screen.getByLabelText(/^starts$/i), '2026-09-18T11:00')
    await user.type(screen.getByLabelText(/^ends$/i), '2026-09-18T12:00')
    await user.type(screen.getByRole('textbox', { name: /description/i }), '  A practical build session.  ')
    await user.click(screen.getByRole('button', { name: /add agenda item/i }))

    expect(createAgendaItem).toHaveBeenCalledWith(42, expect.objectContaining({
      description: 'A practical build session.',
      endsAt: expect.stringMatching(/^2026-09-18T/),
      position: 2,
      speaker: 'Otieno Kimani',
      startsAt: expect.stringMatching(/^2026-09-18T/),
      title: 'Build lab',
    }))
    expect(await screen.findByRole('heading', { name: 'Build lab' })).toBeInTheDocument()
  })

  it('updates an agenda item and removes it only after confirmation', async () => {
    const user = userEvent.setup()
    updateAgendaItem.mockResolvedValue({ ...firstItem, title: 'Welcome and opening' })
    deleteAgendaItem.mockResolvedValue(undefined)
    render(<AgendaManager eventId={42} />)

    await screen.findByRole('heading', { name: 'Opening remarks' })
    await user.click(screen.getByRole('button', { name: /edit opening remarks/i }))
    const title = screen.getByRole('textbox', { name: /^title$/i })
    await user.clear(title)
    await user.type(title, 'Welcome and opening')
    await user.click(screen.getByRole('button', { name: /update agenda item/i }))

    expect(updateAgendaItem).toHaveBeenCalledWith(10, expect.objectContaining({
      title: 'Welcome and opening',
    }))
    expect(await screen.findByRole('heading', { name: 'Welcome and opening' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete welcome and opening/i }))
    expect(deleteAgendaItem).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /delete item/i }))

    expect(deleteAgendaItem).toHaveBeenCalledWith(10)
    expect(await screen.findByRole('heading', { name: /no agenda items yet/i })).toBeInTheDocument()
  })
})
