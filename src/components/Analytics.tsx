import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { fmtCurrency, groupBy, netPnl, weekdayOf } from '../lib/calc'
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownChart title="Resultado por ativo" data={bySymbol} currency={account.currency} />
        <BreakdownChart title="Resultado por estratégia" data={byStrategy} currency={account.currency} />
        <BreakdownChart title="Resultado por dia da semana" data={byWeekday} currency={account.currency} />
        <BreakdownChart title="Resultado por horário de entrada" data={byHour} currency={account.currency} />
        <BreakdownChart title="Resultado por estado emocional" data={byEmotion} currency={account.currency} />
      </div>
    </div>
  )
}
