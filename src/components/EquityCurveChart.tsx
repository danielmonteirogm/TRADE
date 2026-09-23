import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtCurrency } from '../lib/calc'
import { IconPulse } from './icons'

interface Point {
  date: string
  equity: number
  pnl: number
  symbol: string
}

export function EquityCurveChart({ data, currency }: { data: Point[]; currency: string }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-ink-faint text-sm">
        <IconPulse className="w-6 h-6 opacity-50" />
        Sem operações registradas ainda.
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1f4fb8" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#1f4fb8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#dfe2e8" />
        <XAxis dataKey="date" tick={{ fill: '#8a91a3', fontSize: 11 }} minTickGap={30} />
        <YAxis
          tick={{ fill: '#8a91a3', fontSize: 11 }}
          tickFormatter={(v) => fmtCurrency(v, currency)}
          width={90}
        />
        <Tooltip
          contentStyle={{ background: '#ffffff', border: '1px solid #dfe2e8', borderRadius: 8, boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }}
          labelStyle={{ color: '#101828' }}
          itemStyle={{ color: '#101828' }}
          formatter={(v, name) => [fmtCurrency(Number(v), currency), name === 'equity' ? 'Capital' : String(name)]}
        />
        <Area type="monotone" dataKey="equity" stroke="#1f4fb8" strokeWidth={2} fill="url(#equityFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
