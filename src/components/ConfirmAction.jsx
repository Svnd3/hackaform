import { X } from 'lucide-react'

export default function ConfirmAction({
  busy = false,
  cancelLabel = 'Keep it',
  confirmLabel = 'Yes, continue',
  message,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="confirm-action" role="group" aria-label={message}>
      <span>{message}</span>
      <div>
        <button className="confirm-action__confirm" disabled={busy} onClick={onConfirm} type="button">
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button aria-label={cancelLabel} disabled={busy} onClick={onCancel} type="button">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

