import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { useStore } from '../store'
import { fmtCurrency, fmtPercent, groupBy, netPnl, weekdayOf } from '../lib/calc'
import { PageHeader } from './PageHeader'

const WEEKDAY_ORDER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function BreakdownChart({
  title,
  data,
  currency,
}: {
  title: string
  data: { key: string; pnl: number; count: number }[]
  currency: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="font-medium text-sm text-ink-muted mb-3">{title}</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-ink-faint text-sm">Sem dados</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe2e8" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#8a91a3', fontSize: 11 }} tickFormatter={(v) => fmtCurrency(v, currency)} />
            <YAxis type="category" dataKey="key" tick={{ fill: '#4b5468', fontSize: 11 }} width={90} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #dfe2e8', borderRadius: 8, boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }}
              labelStyle={{ color: '#101828' }}
              itemStyle={{ color: '#101828' }}
              formatter={(v, _n, item) => [fmtCurrency(Number(v), currency), `${item.payload.count} trades`]}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.pnl >= 0 ? '#0a7a40' : '#b3261e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function GoalBar({ label, value, target, exceeded }: { label: string; value: number; target: number; exceeded: boolean }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="flex-1 min-w-[180px]">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className={`text-xs font-mono tabular-nums ${exceeded ? 'text-negative font-semibold' : 'text-ink-faint'}`}>
          {fmtPercent(target > 0 ? (value / target) * 100 : 0)}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${exceeded ? 'bg-negative' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DailyGainLossPie() {
  const trades = useStore((s) => s.trades)
  const goals = useStore((s) => s.goals)
  const account = useStore((s) => s.account)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTrades = useMemo(() => trades.filter((t) => t.date === today), [trades, today])

  const { gains, losses } = useMemo(() => {
    let gains = 0
    let losses = 0
    for (const t of todayTrades) {
      const p = netPnl(t)
      if (p > 0) gains += p
      else if (p < 0) losses += Math.abs(p)
    }
    return { gains, losses }
  }, [todayTrades])

  const net = gains - losses
  const hasData = gains > 0 || losses > 0
  const gainExceeded = goals.dailyTarget > 0 && gains >= goals.dailyTarget
  const lossExceeded = goals.maxDailyLoss > 0 && losses >= goals.maxDailyLoss
  const data = [
    { name: 'Ganhos', value: gains },
    { name: 'Perdas', value: losses },
  ]

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="font-medium text-sm text-ink-muted mb-3">Ganhos x Perdas — hoje</h3>
      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-ink-faint text-sm">Nenhuma operação hoje ainda.</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-[170px] h-[170px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={gains > 0 && losses > 0 ? 3 : 0}
                  stroke="none"
                >
                  <Cell fill="#0a7a40" />
                  <Cell fill="#b3261e" />
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #dfe2e8', borderRadius: 8, boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }}
                  formatter={(v, name) => [fmtCurrency(Number(v), account.currency), String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wide text-ink-faint">Líquido</span>
              <span className={`font-mono tabular-nums text-sm font-semibold ${net >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtCurrency(net, account.currency)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-positive shrink-0" /> Ganhos
              </span>
              <span className="font-mono tabular-nums text-sm font-semibold text-positive">{fmtCurrency(gains, account.currency)}</span>
            </div>
            <div className="flex items-center justify-between -mt-2.5">
              <span className="flex items-center gap-1.5 text-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-negative shrink-0" /> Perdas
              </span>
              <span className="font-mono tabular-nums text-sm font-semibold text-negative">{fmtCurrency(losses, account.currency)}</span>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 border-t border-border">
              <GoalBar label={`Meta diária (${fmtCurrency(goals.dailyTarget, account.currency)})`} value={gains} target={goals.dailyTarget} exceeded={false} />
              <GoalBar
                label={`Limite de perda (${fmtCurrency(goals.maxDailyLoss, account.currency)})`}
                value={losses}
                target={goals.maxDailyLoss}
                exceeded={lossExceeded}
              />
            </div>
            {gainExceeded && <p className="text-positive text-xs font-medium">Meta diária de ganhos atingida.</p>}
            {lossExceeded && <p className="text-negative text-xs font-medium">Limite de perda diária ultrapassado.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export function Analytics() {
  const trades = useStore((s) => s.trades)
  const account = useStore((s) => s.account)

  const bySymbol = useMemo(() => {
    const map = groupBy(trades, (t) => t.symbol)
    return Array.from(map.entries())
      .map(([key, ts]) => ({ key, pnl: ts.reduce((s, t) => s + netPnl(t), 0), count: ts.length }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [trades])

  const byStrategy = useMemo(() => {
    const map = groupBy(trades, (t) => t.strategy || 'Sem estratégia')
    return Array.from(map.entries())
      .map(([key, ts]) => ({ key, pnl: ts.reduce((s, t) => s + netPnl(t), 0), count: ts.length }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [trades])

  const byWeekday = useMemo(() => {
    const map = groupBy(trades, (t) => weekdayOf(t.date))
    return WEEKDAY_ORDER.filter((w) => map.has(w)).map((key) => {
      const ts = map.get(key)!
      return { key, pnl: ts.reduce((s, t) => s + netPnl(t), 0), count: ts.length }
    })
  }, [trades])

  const byHour = useMemo(() => {
    const map = groupBy(trades, (t) => (t.entryTime ? t.entryTime.slice(0, 2) + 'h' : 'Sem horário'))
    return Array.from(map.entries())
      .map(([key, ts]) => ({ key, pnl: ts.reduce((s, t) => s + netPnl(t), 0), count: ts.length }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [trades])

  const byEmotion = useMemo(() => {
    const map = groupBy(
      trades.filter((t) => t.emotion),
      (t) => t.emotion || '',
    )
    return Array.from(map.entries())
      .map(([key, ts]) => ({ key, pnl: ts.reduce((s, t) => s + netPnl(t), 0), count: ts.length }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [trades])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Análises" description="Onde seu resultado realmente vem — e onde ele vaza." />

      <DailyGainLossPie />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownChart title="Resultado por ativo" data={bySymbol} currency={account.currency} />
        <BreakdownChart title="Resultado por estratégia" data={byStrategy} currency={account.currency} />
        <BreakdownChart title="Resultado por dia da semana" data={byWeekday} currency={account.currency} />
        <BreakdownChart title="Resultado por horário de entrada" data={byHour} currency={account.currency} />
        <BreakdownChart
          title="Resultado por estado emocional"
          data={byEmotion}
          currency={account.currency}
        />
        {byEmotion.length === 0 && (
          <p className="md:col-span-2 -mt-2 text-xs text-ink-faint px-1">
            Vazio porque nenhuma operação tem o campo "Emoção" preenchido — é opcional no formulário e não vem no
            extrato da corretora. Preencha ao registrar manualmente para ver esse cruzamento.
          </p>
        )}
      </div>
    </div>
  )
}
