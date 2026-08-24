import {
  ArrowRight,
  Bookmark,
  CalendarCheck2,
  Database,
  Route,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="container about-hero__grid">
          <div>
            <p className="eyebrow">Why Hackaform exists</p>
            <h1>Life gets better when we leave the group chat.</h1>
          </div>
          <div className="about-hero__copy">
            <p>Great opportunities across Kenya and East Africa are scattered across event pages and community channels. Built in Nairobi, Hackaform brings them into one calm place while keeping useful online and global events within reach.</p>
            <Link className="button button--acid button--large" to="/events">See what’s happening <ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="about-marquee" aria-hidden="true">
          <span>DISCOVER • SAVE • SHOW UP • GROW •</span>
          <span>DISCOVER • SAVE • SHOW UP • GROW •</span>
        </div>
      </header>

      <section className="page-section">
        <div className="container">
          <div className="about-section-heading">
            <p className="eyebrow">Simple on purpose</p>
            <h2>From “what’s on?” to “I’m going.”</h2>
          </div>
          <div className="how-grid">
            <article><span>01</span><Search aria-hidden="true" /><h3>Explore freely</h3><p>Search the live catalogue by topic, location, date and format.</p></article>
            <article><span>02</span><Bookmark aria-hidden="true" /><h3>Choose your event</h3><p>Save a shortlist, compare the details and create an account when you are ready.</p></article>
            <article><span>03</span><CalendarCheck2 aria-hidden="true" /><h3>Book and manage</h3><p>Reserve a place on Hackaform, update your booking and keep every plan in one schedule.</p></article>
          </div>
        </div>
      </section>

      <section className="about-data-section">
        <div className="container about-data-grid">
          <div className="about-data-card">
            <Database size={30} aria-hidden="true" />
            <p className="eyebrow">A full-stack platform</p>
            <h2>Real events. Real bookings. One source of truth.</h2>
            <p>Hackaform now runs on its own Flask API and relational database. Organizers publish events and agendas while attendees make persistent bookings with live capacity checks.</p>
            <a href="https://github.com/Svnd3/hackaform#architecture" rel="noreferrer" target="_blank">Explore the architecture <ArrowRight size={16} /></a>
          </div>
          <div className="about-principles">
            <div><ShieldCheck aria-hidden="true" /><span><strong>Protected by ownership</strong><small>Authentication and server-side checks keep each organizer’s events and attendee’s bookings private to them.</small></span></div>
            <div><UserRoundCheck aria-hidden="true" /><span><strong>Made for real people</strong><small>Responsive, keyboard-friendly and honest about availability, errors and empty states.</small></span></div>
            <div><Route aria-hidden="true" /><span><strong>Ready to grow</strong><small>A focused booking platform with room for reminders, waitlists, payments and richer community tools.</small></span></div>
          </div>
        </div>
      </section>

      <section className="page-section roadmap-section">
        <div className="container">
          <div className="about-section-heading">
            <p className="eyebrow">The capstone roadmap</p>
            <h2>Built as a foundation, not a dead end.</h2>
          </div>
          <div className="roadmap">
            <article className="roadmap__item"><span>Built</span><strong>01</strong><div><h3>Discover</h3><p>React interface, public API research, routing, filtering and browser-based saving.</p></div></article>
            <article className="roadmap__item roadmap__item--current"><span>Now</span><strong>02</strong><div><h3>Organize &amp; book</h3><p>Flask API, PostgreSQL, authentication, organizer-created agendas and genuine reservation records.</p></div></article>
            <article className="roadmap__item"><span>Next</span><strong>03</strong><div><h3>Belong</h3><p>Waitlists, reminders, calendar sync and richer tools for growing event communities.</p></div></article>
          </div>
        </div>
      </section>
    </div>
  )
}
