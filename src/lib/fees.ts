import type { Trade } from '../types'

// Estimativa de emolumentos B3 (taxa de registro + negociação/liquidação) por
// contrato, por perna (compra OU venda), para os minicontratos mais comuns de
// day trade. A B3 aplica descontos por faixa de volume (ADV) e a corretagem
// pode variar — trate isso como uma ESTIMATIVA de referência, não o valor
// exato. Para o valor exato, confira a nota de corretagem do dia.
// Fontes: b3.com.br/.../tarifas-de-ibovespa-e-indice-brasil-50 (WIN ~R$0,25/perna)
// e levantamento de corretoras para WDO (~R$1,20/perna).
export const B3_FEE_PER_CONTRACT_SIDE: Record<string, number> = {
  WIN: 0.25, // mini-índice Bovespa
  IND: 1.25, // índice Bovespa cheio (estimativa proporcional, confirme)
  WDO: 1.2, // mini-dólar
  DOL: 6.0, // dólar cheio (estimativa proporcional, confirme)
}

// Extrai a "raiz" do código do contrato futuro (ex: WINV26 -> WIN, WDOF27 -> WDO):
// os 3 últimos caracteres costumam ser 1 letra de vencimento + 2 dígitos de ano.
export function symbolRoot(symbol: string): string {
  const m = symbol.match(/^([A-Z]+)[A-Z]\d{2}$/)
  return m ? m[1] : symbol
}

export interface FeeEstimateItem {
  symbol: string
  contracts: number
  ratePerSide: number | null
  subtotal: number
}

export interface FeeEstimate {
  total: number
  items: FeeEstimateItem[]
  hasUnknownSymbol: boolean
}

export function estimateB3Fees(trades: Trade[], date: string): FeeEstimate {
  const dayTrades = trades.filter((t) => t.date === date)
  const bySymbol = new Map<string, number>()
  for (const t of dayTrades) {
    bySymbol.set(t.symbol, (bySymbol.get(t.symbol) ?? 0) + t.quantity)
  }

  const items: FeeEstimateItem[] = []
  let total = 0
  let hasUnknownSymbol = false

  for (const [symbol, contracts] of bySymbol) {
    const root = symbolRoot(symbol)
    const rate = B3_FEE_PER_CONTRACT_SIDE[root] ?? null
    if (rate === null) hasUnknownSymbol = true
    // 2 pernas (entrada + saída) por contrato fechado
    const subtotal = (rate ?? 0) * contracts * 2
    total += subtotal
    items.push({ symbol, contracts, ratePerSide: rate, subtotal })
  }

  return { total: Math.round(total * 100) / 100, items, hasUnknownSymbol }
}
