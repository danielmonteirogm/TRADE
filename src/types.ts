export type TradeSide = 'compra' | 'venda'

export interface Trade {
  id: string
  date: string // yyyy-MM-dd
  entryTime?: string // HH:mm
  exitTime?: string // HH:mm
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  exitPrice: number
  stopLoss?: number
  multiplier?: number // valor financeiro por ponto/unidade (ex: 0.2 para WIN, 10 para WDO). Padrão 1.
  fees: number
  strategy?: string
  setup?: string
  emotion?: string
  notes?: string
  tags: string[]
  createdAt: string
}

export interface Account {
  name: string
  initialBalance: number
  currency: string
}

export interface Goals {
  dailyTarget: number
  weeklyTarget: number
  monthlyTarget: number
  maxDailyLoss: number
  maxTradesPerDay: number
}

export interface RuleItem {
  id: string
  text: string
}

export interface RuleCheckState {
  // key = `${dateISO}:${ruleId}` -> checked
  [key: string]: boolean
}

export const EMOTIONS = [
  'Confiante',
  'Ansioso',
  'Disciplinado',
  'Ganancioso',
  'Com medo',
  'Frustrado',
  'Neutro',
  'Impulsivo',
] as const

export const DEFAULT_STRATEGIES = [
  'Rompimento',
  'Reversão',
  'Pullback',
  'Tendência',
  'Scalping',
  'Notícia',
  'Suporte/Resistência',
] as const
