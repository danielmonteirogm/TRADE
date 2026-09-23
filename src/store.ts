import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Account, Goals, RuleCheckState, RuleItem, Trade } from './types'

interface State {
  trades: Trade[]
  account: Account
  goals: Goals
  rules: RuleItem[]
  ruleChecks: RuleCheckState
  addTrade: (t: Omit<Trade, 'id' | 'createdAt'>) => void
  updateTrade: (id: string, t: Omit<Trade, 'id' | 'createdAt'>) => void
  deleteTrade: (id: string) => void
  importTrades: (trades: Trade[]) => void
  applyDailyFees: (date: string, totalFees: number) => void
  setAccount: (a: Account) => void
  setGoals: (g: Goals) => void
  addRule: (text: string) => void
  removeRule: (id: string) => void
  toggleRuleCheck: (dateISO: string, ruleId: string) => void
}

const defaultRules: RuleItem[] = [
  { id: uuid(), text: 'Defini meu risco máximo por operação antes de entrar' },
  { id: uuid(), text: 'Respeitei meu stop loss sem mover' },
  { id: uuid(), text: 'Não entrei por impulso ou FOMO' },
  { id: uuid(), text: 'Parei ao atingir a meta de perda diária' },
  { id: uuid(), text: 'Registrei o trade no diário' },
]

export const useStore = create<State>()(
  persist(
    (set) => ({
      trades: [],
      account: { name: 'Minha Conta', initialBalance: 10000, currency: 'BRL' },
      goals: { dailyTarget: 200, weeklyTarget: 1000, monthlyTarget: 4000, maxDailyLoss: 300, maxTradesPerDay: 5 },
      rules: defaultRules,
      ruleChecks: {},
      addTrade: (t) =>
        set((s) => ({
          trades: [...s.trades, { ...t, id: uuid(), createdAt: new Date().toISOString() }],
        })),
      updateTrade: (id, t) =>
        set((s) => ({
          trades: s.trades.map((tr) => (tr.id === id ? { ...tr, ...t } : tr)),
        })),
      deleteTrade: (id) => set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
      importTrades: (trades) => set((s) => ({ trades: [...s.trades, ...trades] })),
      applyDailyFees: (date, totalFees) =>
        set((s) => {
          const dayTrades = s.trades.filter((t) => t.date === date)
          const totalQty = dayTrades.reduce((sum, t) => sum + t.quantity, 0)
          if (totalQty === 0) return {}
          return {
            trades: s.trades.map((t) =>
              t.date === date ? { ...t, fees: totalFees * (t.quantity / totalQty) } : t,
            ),
          }
        }),
      setAccount: (a) => set({ account: a }),
      setGoals: (g) => set({ goals: g }),
      addRule: (text) => set((s) => ({ rules: [...s.rules, { id: uuid(), text }] })),
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRuleCheck: (dateISO, ruleId) =>
        set((s) => {
          const key = `${dateISO}:${ruleId}`
          return { ruleChecks: { ...s.ruleChecks, [key]: !s.ruleChecks[key] } }
        }),
    }),
    { name: 'trader-journal-storage' },
  ),
)
