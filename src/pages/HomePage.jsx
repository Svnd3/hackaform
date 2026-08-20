import { ArrowRight, CheckCircle2, Compass, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryChips from '../components/CategoryChips.jsx'
import EventCard from '../components/EventCard.jsx'
import EventGrid from '../components/EventGrid.jsx'
import HeroPoster from '../components/HeroPoster.jsx'
import SearchPanel from '../components/SearchPanel.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { EmptyState, ErrorState, LoadingGrid } from '../components/StateViews.jsx'
import { useEventCatalog } from '../hooks/useEventCatalog.js'

export default function HomePage() {
  const { events, loading, error, retry } = useEventCatalog({ pageSize: 24 })
  const featuredEvent = events.find((event) => event.imageUrl) ?? events[0]
  const spotlightEvents = events.filter((event) => event.id !== featuredEvent?.id).slice(0, 2)
  const upcomingEvents = events.filter(
    (event) => ![featuredEvent?.id, ...spotlightEvents.map((item) => item.id)].includes(event.id),
  ).slice(0, 6)

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__texture" aria-hidden="true" />
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <div className="announcement-pill">
              <span><Sparkles size={14} aria-hidden="true" /></span>
              Built in Nairobi · opportunities updated daily
            </div>
            <h1>
              Find something <em>worth</em> showing up for.
            </h1>
            <p className="home-hero__lede">
              Discover hackathons, workshops, meetups and conferences in Kenya, across East Africa and online.
            </p>
            <div className="home-hero__actions">
              <Link className="button button--primary button--large" to="/events">
                Explore what’s on <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <Link className="button button--ghost button--large" to="/about">
                How Hackaform works
              </Link>
            </div>
            <div className="home-hero__proof">
              <div className="proof-faces" aria-hidden="true">
                <span>AM</span><span>JK</span><span>ZO</span><span>+</span>
              </div>
              <p><strong>Built in Nairobi, for the curious.</strong><br />Find your next room—or online space—to grow in.</p>
            </div>
          </div>

          <div className="home-hero__visual">
            <span className="poster-doodle poster-doodle--one" aria-hidden="true">✦</span>
            <span className="poster-doodle poster-doodle--two" aria-hidden="true">GOOD<br />TIMES</span>
            <HeroPoster event={featuredEvent} loading={loading} />
          </div>
        </div>
      </section>

      <div className="container search-panel-wrap">
        <SearchPanel />
      </div>

      <section className="category-section">
        <div className="container">
          <div className="category-section__header">
            <p className="eyebrow">Pick your energy</p>
            <p>Browse by what gets you learning, building or out the door.</p>
          </div>
          <CategoryChips limit={8} />
        </div>
      </section>

      <section className="page-section spotlight-section">
        <div className="container">
          <SectionHeading
            copy="A live mix of Kenyan, regional, online and selected global opportunities to add to your calendar."
            eyebrow="Worth a look"
            link="/events"
            title="This week’s good reasons to go out."
          />

          {error ? (
            <ErrorState onRetry={retry} />
          ) : loading ? (
            <LoadingGrid count={3} />
          ) : events.length > 0 ? (
            <div className="spotlight-grid">
              <EventCard event={featuredEvent} featured eager />
              <div className="spotlight-grid__side">
                {spotlightEvents.map((event) => <EventCard event={event} key={event.id} />)}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <section className="page-section upcoming-section">
        <div className="container">
          <SectionHeading
            eyebrow="Plan ahead"
            link="/events"
            linkLabel="Browse every event"
            title="More dates for your diary."
          />
          {error ? null : loading ? (
            <LoadingGrid />
          ) : events.length > 0 ? (
            <EventGrid events={upcomingEvents.length ? upcomingEvents : events.slice(0, 6)} />
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <section className="container closing-cta-wrap">
        <div className="closing-cta">
          <div className="closing-cta__icon"><Compass size={34} aria-hidden="true" /></div>
          <div>
            <p className="eyebrow">Your next chapter might start here</p>
            <h2>Less scrolling. More showing up.</h2>
            <p>Search the live catalogue, save a shortlist, then register on the organizer’s own website.</p>
          </div>
          <div className="closing-cta__actions">
            <Link className="button button--acid button--large" to="/events">
              Find my next event <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <span><CheckCircle2 size={16} aria-hidden="true" /> No Hackaform account needed</span>
          </div>
        </div>
      </section>
    </>
  )
}
