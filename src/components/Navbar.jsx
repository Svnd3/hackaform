import { useEffect, useRef, useState } from 'react'
import { Bookmark, Menu, Search, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSavedEvents } from '../hooks/useSavedEvents.js'
import Brand from './Brand.jsx'

const navigation = [
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
          <NavLink className="button button--dark nav-cta" to="/events">
            Find events
          </NavLink>
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
            <NavLink className="button button--primary" onClick={() => setMenuOpen(false)} to="/events">
              Browse all events
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
