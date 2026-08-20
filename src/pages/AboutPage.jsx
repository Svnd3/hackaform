import { ArrowRight, Bookmark, Database, Search, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react'
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
          <span>DISCOVER ✦ SAVE ✦ SHOW UP ✦ GROW ✦</span>
          <span>DISCOVER ✦ SAVE ✦ SHOW UP ✦ GROW ✦</span>
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
            <article><span>02</span><Bookmark aria-hidden="true" /><h3>Keep a shortlist</h3><p>Save promising events locally without creating an account.</p></article>
            <article><span>03</span><Sparkles aria-hidden="true" /><h3>Register with the host</h3><p>Continue to the organizer’s website for the latest details and registration. Hackaform does not take bookings.</p></article>
          </div>
        </div>
      </section>

      <section className="about-data-section">
        <div className="container about-data-grid">
          <div className="about-data-card">
            <Database size={30} aria-hidden="true" />
            <p className="eyebrow">Live public data</p>
            <h2>Fresh events, not a frozen demo.</h2>
            <p>Hackaform combines live Kenyan GDG listings with published events from Eventyay, WordPress Events and Codeforces, then safely normalizes all four sources into one useful catalogue.</p>
            <a href="https://github.com/Svnd3/hackaform#data-sources" rel="noreferrer" target="_blank">Explore the data sources <ArrowRight size={16} /></a>
          </div>
          <div className="about-principles">
            <div><ShieldCheck aria-hidden="true" /><span><strong>A clear handoff</strong><small>In this phase, registration happens on the organizer’s site; Hackaform does not take payment.</small></span></div>
            <div><UserRoundCheck aria-hidden="true" /><span><strong>Made for real people</strong><small>Responsive, keyboard-friendly and clear about external links.</small></span></div>
            <div><Sparkles aria-hidden="true" /><span><strong>Ready to grow</strong><small>A focused first phase with a deliberate full-stack roadmap.</small></span></div>
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
            <article className="roadmap__item roadmap__item--current"><span>Now</span><strong>01</strong><div><h3>Discover</h3><p>React interface, public API integration, routing, filtering and browser-based saving.</p></div></article>
            <article className="roadmap__item"><span>Next</span><strong>02</strong><div><h3>Book</h3><p>Flask API, database, organizer-created events and genuine reservation records.</p></div></article>
            <article className="roadmap__item"><span>Then</span><strong>03</strong><div><h3>Belong</h3><p>Authentication, personal bookings, cancellations and an organizer dashboard.</p></div></article>
          </div>
        </div>
      </section>
    </div>
  )
}
