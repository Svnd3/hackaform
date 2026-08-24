import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

export default function InlineNotice({ children, kind = 'error' }) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'info' ? Info : CheckCircle2

  return (
    <div className={`inline-notice inline-notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
