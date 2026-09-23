import { useState } from 'react'
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import { fmtCurrency } from '../lib/calc'

interface Props {
  dailyPnl: Record<string, number>
  currency: string
}

export function CalendarHeatmap({ dailyPnl, currency }: Props) {
  const [cursor, setCursor] = useState(new Date())

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  const monthValues = Object.entries(dailyPnl).filter(([date]) => {
    const d = new Date(date + 'T00:00:00')
    return isSameMonth(d, cursor)
  })
  const monthTotal = monthValues.reduce((s, [, v]) => s + v, 0)
  const maxAbs = Math.max(1, ...monthValues.map(([, v]) => Math.abs(v)))

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="px-2 py-1 rounded-md hover:bg-surface-2 text-ink-faint hover:text-ink-muted"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-medium text-sm capitalize text-ink">{format(cursor, 'MMMM yyyy', { locale: ptBR })}</div>
          <div className={clsx('text-xs font-mono tabular-nums', monthTotal >= 0 ? 'text-positive' : 'text-negative')}>
            {fmtCurrency(monthTotal, currency)}
          </div>
        </div>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="px-2 py-1 rounded-md hover:bg-surface-2 text-ink-faint hover:text-ink-muted"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-faint mb-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const val = dailyPnl[key]
          const inMonth = isSameMonth(d, cursor)
          const intensity = val ? Math.min(1, Math.abs(val) / maxAbs) : 0
          return (
            <div
              key={key}
              title={val !== undefined ? `${key}: ${fmtCurrency(val, currency)}` : key}
              className={clsx(
                'aspect-square rounded-md flex flex-col items-center justify-center text-[10px] p-1 transition-transform hover:scale-[1.05]',
                !inMonth && 'opacity-25',
                val === undefined && 'bg-surface-2/60 text-ink-faint',
              )}
              style={
                val !== undefined
                  ? {
                      backgroundColor:
                        val >= 0
                          ? `rgba(10, 122, 64, ${0.1 + intensity * 0.35})`
                          : `rgba(179, 38, 30, ${0.1 + intensity * 0.35})`,
                      color: '#101828',
                    }
                  : undefined
              }
            >
              <span className="text-ink-faint">{format(d, 'd')}</span>
              {val !== undefined && (
                <span className="font-mono tabular-nums font-medium">
                  {val >= 0 ? '+' : ''}
                  {val.toFixed(0)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
