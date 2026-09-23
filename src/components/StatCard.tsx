import clsx from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string
  sub?: string
  tone?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
  emphasis?: boolean
}

export function StatCard({ label, value, sub, tone = 'neutral', icon, emphasis }: Props) {
  return (
    <div
      className={clsx(
        'relative rounded-lg p-4 flex flex-col gap-1 bg-surface border transition-colors',
        emphasis ? 'border-border shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'border-border hover:border-border-strong',
      )}
    >
      {emphasis && <span className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-accent" />}
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">{label}</span>
        {icon}
      </div>
      <span
        className={clsx('font-mono tabular-nums font-semibold', emphasis ? 'text-2xl' : 'text-xl', {
          'text-positive': tone === 'positive',
          'text-negative': tone === 'negative',
          'text-ink': tone === 'neutral',
        })}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-ink-faint">{sub}</span>}
    </div>
  )
}
