import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Dashboard } from './components/Dashboard'
import { TradeLog } from './components/TradeLog'
import { Analytics } from './components/Analytics'
import { RiskCalculator } from './components/RiskCalculator'
import { Goals } from './components/Goals'
import { Rules } from './components/Rules'
import { Settings } from './components/Settings'
import { Toast } from './components/Toast'
import { useStore } from './store'
import { dailyPnlMap, fmtCurrency } from './lib/calc'
import {
  IconBars,
  IconFlag,
  IconGauge,
  IconLedger,
  IconPulse,
  IconShieldCheck,
  IconSliders,
  IconTrendUp,
} from './components/icons'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: IconPulse },
  { id: 'trades', label: 'Operações', icon: IconLedger },
  { id: 'analytics', label: 'Análises', icon: IconBars },
  { id: 'risk', label: 'Calculadora de risco', icon: IconGauge },
  { id: 'goals', label: 'Metas', icon: IconFlag },
  { id: 'rules', label: 'Disciplina', icon: IconShieldCheck },
  { id: 'settings', label: 'Configurações', icon: IconSliders },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const account = useStore((s) => s.account)
  const trades = useStore((s) => s.trades)

  const todayPnl = useMemo(() => {
    const map = dailyPnlMap(trades)
    return map[format(new Date(), 'yyyy-MM-dd')] ?? 0
  }, [trades])

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-accent text-accent-fg shrink-0">
            <IconTrendUp className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-ink truncate">TraderDesk</h1>
            <p className="text-[11px] text-ink-faint truncate">{account.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'group relative flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  active ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <span
                  className={clsx(
                    'absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon className={clsx('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-ink-faint group-hover:text-ink-muted')} />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="mx-3 mb-4 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-ink-faint mb-0.5">Hoje</p>
          <p
            className={clsx(
              'font-mono tabular-nums text-sm font-semibold',
              todayPnl > 0 ? 'text-positive' : todayPnl < 0 ? 'text-negative' : 'text-ink-muted',
            )}
          >
            {todayPnl >= 0 ? '+' : ''}
            {fmtCurrency(todayPnl, account.currency)}
          </p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'trades' && <TradeLog />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'risk' && <RiskCalculator />}
        {tab === 'goals' && <Goals />}
        {tab === 'rules' && <Rules />}
        {tab === 'settings' && <Settings />}
      </main>
      <Toast />
    </div>
  )
}

export default App
