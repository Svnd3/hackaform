import { Bookmark } from 'lucide-react'
import { useSavedEvents } from '../hooks/useSavedEvents.js'

export default function SaveButton({ event, label = false, light = false }) {
  const { isSaved, toggleSaved } = useSavedEvents()
  const saved = isSaved(event.id)

  return (
    <button
      aria-pressed={saved}
      aria-label={saved ? `Remove ${event.name} from saved events` : `Save ${event.name}`}
      className={`save-button${saved ? ' save-button--saved' : ''}${label ? ' save-button--label' : ''}${light ? ' save-button--light' : ''}`}
      onClick={() => toggleSaved(event)}
      type="button"
    >
      <Bookmark size={label ? 19 : 18} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {label && <span>{saved ? 'Saved to my list' : 'Save for later'}</span>}
    </button>
  )
}
