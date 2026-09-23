import type { Trade } from '../types'

export function grossPnl(t: Trade): number {
  const diff = t.side === 'compra' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice
  return diff * t.quantity * (t.multiplier ?? 1)
}

export function netPnl(t: Trade): number {
  return grossPnl(t) - (t.fees || 0)
}

export function rMultiple(t: Trade): number | null {
  if (t.stopLoss === undefined || t.stopLoss === null) return null
  const riskPerUnit = Math.abs(t.entryPrice - t.stopLoss)
  if (riskPerUnit === 0) return null
  const risk = riskPerUnit * t.quantity * (t.multiplier ?? 1)
  return netPnl(t) / risk
}

export interface Stats {
  totalTrades: number
  netPnl: number
  grossPnl: number
  totalFees: number
  wins: number
  losses: number
  breakeven: number
  winRate: number
  avgWin: number
  avgLoss: number
  payoffRatio: number
  profitFactor: number
  expectancy: number
  bestTrade: number
  worstTrade: number
  maxDrawdown: number
  currentStreak: number
  longestWinStreak: number
  longestLossStreak: number
  avgRMultiple: number | null
}

export function computeStats(trades: Trade[]): Stats {
  const sorted = [...trades].sort((a, b) => (a.date + (a.exitTime || '')).localeCompare(b.date + (b.exitTime || '')))
  const pnls = sorted.map(netPnl)

  const wins = pnls.filter((p) => p > 0)
  const losses = pnls.filter((p) => p < 0)
  const breakeven = pnls.filter((p) => p === 0).length

  const grossProfit = wins.reduce((s, p) => s + p, 0)
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0))

  const netTotal = pnls.reduce((s, p) => s + p, 0)
  const grossTotal = sorted.reduce((s, t) => s + grossPnl(t), 0)
  const totalFees = sorted.reduce((s, t) => s + (t.fees || 0), 0)

  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const winRate = sorted.length ? (wins.length / sorted.length) * 100 : 0
  const payoffRatio = avgLoss !== 0 ? avgWin / avgLoss : 0
  const profitFactor = grossLoss !== 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  const expectancy = sorted.length
    ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
    : 0

  // equity curve & drawdown
  let equity = 0
  let peak = 0
  let maxDrawdown = 0
  for (const p of pnls) {
    equity += p
    peak = Math.max(peak, equity)
    maxDrawdown = Math.min(maxDrawdown, equity - peak)
  }

  // streaks
  let currentStreak = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  let runWin = 0
  let runLoss = 0
  for (const p of pnls) {
    if (p > 0) {
      runWin += 1
      runLoss = 0
      longestWinStreak = Math.max(longestWinStreak, runWin)
    } else if (p < 0) {
      runLoss += 1
      runWin = 0
      longestLossStreak = Math.max(longestLossStreak, runLoss)
    } else {
      runWin = 0
      runLoss = 0
    }
  }
  if (pnls.length) {
    const last = pnls[pnls.length - 1]
    if (last > 0) {
      let i = pnls.length - 1
      let c = 0
      while (i >= 0 && pnls[i] > 0) {
        c++
        i--
      }
      currentStreak = c
    } else if (last < 0) {
      let i = pnls.length - 1
      let c = 0
      while (i >= 0 && pnls[i] < 0) {
        c++
        i--
      }
      currentStreak = -c
    }
  }

  const rMultiples = sorted.map(rMultiple).filter((r): r is number => r !== null)
  const avgRMultiple = rMultiples.length ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : null

  return {
    totalTrades: sorted.length,
    netPnl: netTotal,
    grossPnl: grossTotal,
    totalFees,
    wins: wins.length,
    losses: losses.length,
    breakeven,
    winRate,
    avgWin,
    avgLoss,
    payoffRatio,
    profitFactor,
    expectancy,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    maxDrawdown,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    avgRMultiple,
  }
}

export function equityCurve(trades: Trade[], initialBalance = 0) {
  const sorted = [...trades].sort((a, b) => (a.date + (a.exitTime || '')).localeCompare(b.date + (b.exitTime || '')))
  let equity = initialBalance
  return sorted.map((t) => {
    equity += netPnl(t)
    return { date: t.date, equity, pnl: netPnl(t), symbol: t.symbol }
  })
}

export function dailyPnlMap(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const t of trades) {
    map[t.date] = (map[t.date] || 0) + netPnl(t)
  }
  return map
}

export function groupBy<T extends string>(trades: Trade[], keyFn: (t: Trade) => T) {
  const map = new Map<T, Trade[]>()
  for (const t of trades) {
    const k = keyFn(t)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(t)
  }
  return map
}

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function weekdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS_PT[d.getDay()]
}

export function fmtCurrency(v: number, currency = 'BRL') {
  return v.toLocaleString('pt-BR', { style: 'currency', currency })
}

export function fmtPercent(v: number) {
  return `${v.toFixed(1)}%`
}
