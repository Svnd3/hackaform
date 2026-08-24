import { useEffect, useRef, useState } from 'react'
import { Bookmark, CalendarCheck2, LogIn, LogOut, Menu, PlusCircle, Search, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useSavedEvents } from '../hooks/useSavedEvents.js'
import Brand from './Brand.jsx'

const publicNavigation = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/events' },
  { label: 'Saved', to: '/saved' },
  { label: 'About', to: '/about' },
]

function navClass({ isActive }) {
  return `nav-link${isActive ? ' nav-link--active' : ''}`
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const { savedCount } = useSavedEvents()
  const { authenticated, logout, user } = useAuth()
  const navigation = authenticated
    ? [
        ...publicNavigation.slice(0, 2),
        { label: 'My schedule', to: '/schedule' },
        ...publicNavigation.slice(2),
      ]
    : publicNavigation

  useEffect(() => {
    if (!menuOpen) return undefined

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Brand />

        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink className={navClass} key={item.to} onClick={() => setMenuOpen(false)} to={item.to}>
              {item.label}
              {item.to === '/saved' && savedCount > 0 && (
                <span className="nav-count" aria-label={`${savedCount} saved events`}>
                  {savedCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <NavLink className="nav-search" to="/events" aria-label="Search events">
            <Search size={19} aria-hidden="true" />
          </NavLink>
          {authenticated ? (
            <>
              <NavLink className="nav-user" to="/organizer" title="Open organizer studio">
                <span>{user.name?.slice(0, 1).toUpperCase() || 'H'}</span>
                <small>{user.name?.split(' ')[0]}</small>
              </NavLink>
              <button className="nav-logout" onClick={logout} type="button" aria-label="Sign out"><LogOut size={18} /></button>
            </>
          ) : (
            <NavLink className="button button--dark nav-cta" to="/login">
              Sign in <LogIn size={17} aria-hidden="true" />
            </NavLink>
          )}
          <button
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav mobile-nav--open" id="mobile-navigation">
          <nav className="container" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <NavLink className={navClass} key={item.to} onClick={() => setMenuOpen(false)} to={item.to}>
                <span>{item.label}</span>
                {item.to === '/saved' && (
                  <span className="mobile-saved-count">
                    <Bookmark size={17} aria-hidden="true" />
                    {savedCount}
                  </span>
                )}
              </NavLink>
            ))}
            {authenticated ? (
              <>
                <NavLink className="button button--primary" onClick={() => setMenuOpen(false)} to="/organizer"><PlusCircle size={17} /> Organizer studio</NavLink>
                <button className="mobile-signout" onClick={() => { logout(); setMenuOpen(false) }} type="button"><LogOut size={17} /> Sign out</button>
              </>
            ) : (
              <NavLink className="button button--primary" onClick={() => setMenuOpen(false)} to="/login"><CalendarCheck2 size={17} /> Sign in to plan</NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
