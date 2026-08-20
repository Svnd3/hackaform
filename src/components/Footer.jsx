import { ArrowUpRight, GitBranch, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from './Brand.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-intro">
          <Brand footer />
          <p>
            Find worthwhile opportunities in Kenya, across East Africa and online—then register with the organizer.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <p className="footer-label">Discover</p>
            <Link to="/events">All events</Link>
            <Link to="/events?category=Technology">Technology</Link>
            <Link to="/events?category=Education">Workshops</Link>
            <Link to="/saved">Saved events</Link>
          </div>
          <div>
            <p className="footer-label">Project</p>
            <Link to="/about">About Hackaform</Link>
            <a href="https://github.com/Svnd3/hackaform" rel="noreferrer" target="_blank">
              GitHub <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a href="https://github.com/Svnd3/hackaform#data-sources" rel="noreferrer" target="_blank">
              Data sources <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Hackaform. Built for curious people.</p>
        <p className="footer-made">
          Made with <Heart size={14} fill="currentColor" aria-label="care" /> in Nairobi
        </p>
        <a className="footer-github" href="https://github.com/Svnd3/hackaform" rel="noreferrer" target="_blank">
          <GitBranch size={16} aria-hidden="true" /> Source code
        </a>
      </div>
    </footer>
  )
}
