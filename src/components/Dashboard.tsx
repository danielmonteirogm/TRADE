import { useMemo } from 'react'
import { useStore } from '../store'
import { computeStats, dailyPnlMap, equityCurve, fmtCurrency, fmtPercent } from '../lib/calc'
import { StatCard } from './StatCard'
import { EquityCurveChart } from './EquityCurveChart'
import { CalendarHeatmap } from './CalendarHeatmap'
import { PageHeader } from './PageHeader'
import { format } from 'date-fns'

export function Dashboard() {
  const trades = useStore((s) => s.trades)
  const account = useStore((s) => s.account)
  const goals = useStore((s) => s.goals)

  const stats = useMemo(() => computeStats(trades), [trades])
  const curve = useMemo(() => equityCurve(trades, account.initialBalance), [trades, account.initialBalance])
  const daily = useMemo(() => dailyPnlMap(trades), [trades])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayPnl = daily[today] || 0
  const todayTrades = trades.filter((t) => t.date === today).length

  const currentBalance = account.initialBalance + stats.netPnl
  const goalProgressPct = Math.min(
    100,
    (Math.abs(todayPnl) / (todayPnl >= 0 ? goals.dailyTarget : goals.maxDailyLoss || 1)) * 100,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Visão geral da sua performance de day trade." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          emphasis
          label="Saldo atual"
          value={fmtCurrency(currentBalance, account.currency)}
          sub={`Inicial: ${fmtCurrency(account.initialBalance, account.currency)}`}
        />
        <StatCard
          emphasis
          label="P&L líquido"
          value={fmtCurrency(stats.netPnl, account.currency)}
          tone={stats.netPnl >= 0 ? 'positive' : 'negative'}
          sub={`${stats.totalTrades} operações`}
        />
        <StatCard
          label="Taxa de acerto"
          value={fmtPercent(stats.winRate)}
          sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE`}
        />
        <StatCard
          label="Profit factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          sub={`Payoff ${stats.payoffRatio.toFixed(2)}`}
        />
        <StatCard
          label="Expectativa / trade"
          value={fmtCurrency(stats.expectancy, account.currency)}
          tone={stats.expectancy >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Drawdown máximo" value={fmtCurrency(stats.maxDrawdown, account.currency)} tone="negative" />
        <StatCard
          label="Melhor / Pior trade"
          value={fmtCurrency(stats.bestTrade, account.currency)}
          sub={fmtCurrency(stats.worstTrade, account.currency)}
        />
        <StatCard
          label="Sequência atual"
          value={stats.currentStreak === 0 ? '–' : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? 'vitórias' : 'derrotas'}`}
          tone={stats.currentStreak > 0 ? 'positive' : stats.currentStreak < 0 ? 'negative' : 'neutral'}
          sub={`Máx: ${stats.longestWinStreak}W / ${stats.longestLossStreak}L`}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm text-ink-muted">Metas do dia</h3>
          <span
            className={`font-mono tabular-nums text-sm font-semibold ${todayPnl >= 0 ? 'text-positive' : 'text-negative'}`}
          >
            {fmtCurrency(todayPnl, account.currency)}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${todayPnl >= 0 ? 'bg-positive' : 'bg-negative'}`}
            style={{ width: `${goalProgressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-ink-faint mt-1.5 font-mono tabular-nums">
          <span>Limite de perda: {fmtCurrency(-goals.maxDailyLoss, account.currency)}</span>
          <span>Meta diária: {fmtCurrency(goals.dailyTarget, account.currency)}</span>
        </div>
        {todayPnl <= -goals.maxDailyLoss && (
          <p className="text-negative text-xs mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-negative shrink-0" />
            Limite de perda diária atingido. Considere parar de operar hoje.
          </p>
        )}
        {todayTrades >= goals.maxTradesPerDay && (
          <p className="text-accent text-xs mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            Número máximo de operações do dia atingido ({todayTrades}).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-4">
          <h3 className="font-medium text-sm text-ink-muted mb-2">Curva de capital</h3>
          <EquityCurveChart data={curve} currency={account.currency} />
        </div>
        <CalendarHeatmap dailyPnl={daily} currency={account.currency} />
      </div>
    </div>
  )
}
