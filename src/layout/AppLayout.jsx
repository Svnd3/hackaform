import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import Toast from '../components/Toast.jsx'

export default function AppLayout() {
  const location = useLocation()
  const mainRef = useRef(null)
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    document.title = titleForPath(location.pathname)
    window.scrollTo({ top: 0, behavior: 'instant' })

    if (previousPath.current !== location.pathname) {
      mainRef.current?.focus({ preventScroll: true })
      previousPath.current = location.pathname
    }
  }, [location.pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" ref={mainRef} tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}

function titleForPath(pathname) {
  if (pathname === '/') return 'Tukio — Discover your next event'
  if (pathname === '/events') return 'Explore events — Tukio'
  if (pathname === '/saved') return 'Saved events — Tukio'
  if (pathname === '/about') return 'About — Tukio'
  if (pathname.startsWith('/events/')) return 'Event details — Tukio'
  return 'Page not found — Tukio'
}
