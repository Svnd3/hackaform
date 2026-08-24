import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AuthProvider from '../context/AuthProvider.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

function renderProtected(user) {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <AuthProvider initialUser={user}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<h1>Private workspace</h1>} />
          </Route>
          <Route path="/login" element={<h1>Sign in first</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to sign in', () => {
    renderProtected(null)
    expect(screen.getByRole('heading', { name: 'Sign in first' })).toBeInTheDocument()
  })

  it('renders protected content for an authenticated user', () => {
    renderProtected({ id: 1, name: 'Amina' })
    expect(screen.getByRole('heading', { name: 'Private workspace' })).toBeInTheDocument()
  })
})

