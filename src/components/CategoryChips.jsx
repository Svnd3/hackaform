import {
  BriefcaseBusiness,
  Code2,
  Cpu,
  Dumbbell,
  GraduationCap,
  Music2,
  Palette,
  Sparkles,
  Users2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EVENT_CATEGORIES } from '../data/categories.js'

const iconMap = {
  'Arts & Culture': Palette,
  Business: BriefcaseBusiness,
  Community: Users2,
  Education: GraduationCap,
  Hackathon: Code2,
  Music: Music2,
  Other: Sparkles,
  Sports: Dumbbell,
  Technology: Cpu,
}

export default function CategoryChips({ limit }) {
  const categories = typeof limit === 'number' ? EVENT_CATEGORIES.slice(0, limit) : EVENT_CATEGORIES

  return (
    <div className="category-chips" aria-label="Browse by category">
      {categories.map((category) => {
        const Icon = iconMap[category]
        return (
          <Link key={category} to={`/events?category=${encodeURIComponent(category)}`}>
            <span><Icon size={18} aria-hidden="true" /></span>
            {category}
          </Link>
        )
      })}
    </div>
  )
}
