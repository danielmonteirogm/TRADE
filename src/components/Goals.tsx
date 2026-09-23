import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { dailyPnlMap, fmtCurrency } from '../lib/calc'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { PageHeader } from './PageHeader'

function ProgressBar({ value, target, tone }: { value: number; target: number; tone: 'positive' | 'negative' }) {
  const pct = target !== 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0
  return (
    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone === 'positive' ? 'bg-positive' : 'bg-negative'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Goals() {
  const goals = useStore((s) => s.goals)
  const setGoals = useStore((s) => s.setGoals)
  const trades = useStore((s) => s.trades)
  const account = useStore((s) => s.account)
  const [form, setForm] = useState(goals)

  const daily = useMemo(() => dailyPnlMap(trades), [trades])

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const weekTotal = Object.entries(daily)
    .filter(([d]) => {
      const dt = new Date(d + 'T00:00:00')
      return dt >= weekStart && dt <= weekEnd
    })
    .reduce((s, [, v]) => s + v, 0)

  const monthTotal = Object.entries(daily)
    .filter(([d]) => {
      const dt = new Date(d + 'T00:00:00')
      return dt >= monthStart && dt <= monthEnd
    })
    .reduce((s, [, v]) => s + v, 0)

  const todayTotal = daily[format(now, 'yyyy-MM-dd')] || 0

  function save(e: React.FormEvent) {
    e.preventDefault()
    setGoals(form)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Metas" description="Limites definidos antes do pregão valem mais do que boa vontade durante ele." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-6">
          <h3 className="font-medium text-sm text-ink-muted">Progresso</h3>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-ink-muted">Meta diária</span>
              <span className={`font-mono tabular-nums ${todayTotal >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtCurrency(todayTotal, account.currency)} / {fmtCurrency(goals.dailyTarget, account.currency)}
              </span>
            </div>
            <ProgressBar value={todayTotal} target={goals.dailyTarget} tone={todayTotal >= 0 ? 'positive' : 'negative'} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-ink-muted">Meta semanal</span>
              <span className={`font-mono tabular-nums ${weekTotal >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtCurrency(weekTotal, account.currency)} / {fmtCurrency(goals.weeklyTarget, account.currency)}
              </span>
            </div>
            <ProgressBar value={weekTotal} target={goals.weeklyTarget} tone={weekTotal >= 0 ? 'positive' : 'negative'} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-ink-muted">Meta mensal</span>
              <span className={`font-mono tabular-nums ${monthTotal >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtCurrency(monthTotal, account.currency)} / {fmtCurrency(goals.monthlyTarget, account.currency)}
              </span>
            </div>
            <ProgressBar value={monthTotal} target={goals.monthlyTarget} tone={monthTotal >= 0 ? 'positive' : 'negative'} />
          </div>
        </div>

        <form onSubmit={save} className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3">
          <h3 className="font-medium text-sm text-ink-muted mb-1">Configurar metas e limites</h3>
          <NumField label="Meta diária" value={form.dailyTarget} onChange={(v) => setForm((f) => ({ ...f, dailyTarget: v }))} />
          <NumField label="Meta semanal" value={form.weeklyTarget} onChange={(v) => setForm((f) => ({ ...f, weeklyTarget: v }))} />
          <NumField label="Meta mensal" value={form.monthlyTarget} onChange={(v) => setForm((f) => ({ ...f, monthlyTarget: v }))} />
          <NumField label="Limite de perda diária" value={form.maxDailyLoss} onChange={(v) => setForm((f) => ({ ...f, maxDailyLoss: v }))} />
          <NumField label="Máx. operações por dia" value={form.maxTradesPerDay} onChange={(v) => setForm((f) => ({ ...f, maxTradesPerDay: v }))} />
          <button type="submit" className="mt-2 px-4 py-2 rounded-lg text-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold self-start">
            Salvar
          </button>
        </form>
      </div>
    </div>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-faint">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-lg px-3 py-2 text-sm font-mono" />
    </label>
  )
}
