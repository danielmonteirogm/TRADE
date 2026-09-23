import clsx from 'clsx'
import { useToast } from '../toastStore'

export function Toast() {
  const { message, tone, id } = useToast()

  if (!message) return null

  return (
    <div
      key={id}
      className={clsx(
        'fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg bg-surface animate-toast-in',
        tone === 'success' ? 'border-positive/30 text-ink' : 'border-negative/30 text-ink',
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', tone === 'success' ? 'bg-positive' : 'bg-negative')} />
      {message}
    </div>
  )
}
