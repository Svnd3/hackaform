import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SectionHeading({ eyebrow, title, copy, link, linkLabel = 'View all' }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {copy && <p className="section-heading__copy">{copy}</p>}
      </div>
      {link && (
        <Link className="text-link" to={link}>
          {linkLabel} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
