import { Link } from 'react-router-dom'

export default function Brand({ footer = false }) {
  return (
    <Link className={`brand${footer ? ' brand--footer' : ''}`} to="/" aria-label="Hackaform home">
      <span className="brand__mark" aria-hidden="true">
        <span>H</span>
        <i />
      </span>
      <span className="brand__word">hackaform</span>
    </Link>
  )
}
