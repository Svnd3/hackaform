import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="not-found-page container">
      <div className="not-found__number" aria-hidden="true">404</div>
      <div className="not-found__compass"><Compass size={46} aria-hidden="true" /></div>
      <p className="eyebrow">Wrong turn</p>
      <h1>This event trail goes nowhere.</h1>
      <p>The page may have moved, but there are plenty of worthwhile places left to explore.</p>
      <Link className="button button--primary button--large" to="/"><ArrowLeft size={18} /> Take me home</Link>
    </div>
  )
}
