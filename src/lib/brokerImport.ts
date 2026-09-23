import { v4 as uuid } from 'uuid'
import type { Trade, TradeSide } from '../types'

// Importa o "extrato de ordens" (formato Santander/BMF, separado por ; e com
// cabeçalho de metadados na 1a linha). Cada ordem executada vira um "fill";
// fills opostos do mesmo ativo são casados em FIFO para formar operações
// fechadas (compra->venda ou venda->compra), como um day trade exige.

interface Fill {
  symbol: string
  side: TradeSide
  time: Date
  price: number
  qty: number
  multiplier: number
}

function brNumber(s: string | undefined): number | null {
  if (!s || s === '-') return null
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function brDateTime(s: string | undefined): Date | null {
  if (!s) return null
  const [datePart, timePart] = s.trim().split(' ')
  if (!datePart) return null
  const [dd, mm, yyyy] = datePart.split('/')
  if (!dd || !mm || !yyyy) return null
  return new Date(`${yyyy}-${mm}-${dd}T${timePart || '00:00:00'}`)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface BrokerImportResult {
  trades: Trade[]
  fillsFound: number
  ordersCancelled: number
  openContracts: Record<string, number>
}

const HEADER_MARKER = 'Corretora;Conta;Titular'

export function isSantanderExtrato(text: string): boolean {
  return text.includes(HEADER_MARKER)
}

export function parseSantanderExtrato(text: string): BrokerImportResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const headerIdx = lines.findIndex((l) => l.startsWith(HEADER_MARKER))
  if (headerIdx === -1) {
    return { trades: [], fillsFound: 0, ordersCancelled: 0, openContracts: {} }
  }

  const fills: Fill[] = []
  let cancelled = 0

  for (const line of lines.slice(headerIdx + 1)) {
    const cols = line.split(';')
    if (cols[0] !== 'Santander') continue // ignora sub-linhas de evento (Trade/Cancel)

    const status = cols[6]
    if (status !== 'Executada') {
      if (status === 'Cancelada' || status === 'Rejeitada') cancelled++
      continue
    }

    const symbol = cols[4]
    const side: TradeSide = cols[5] === 'V' ? 'venda' : 'compra'
    const time = brDateTime(cols[8]) ?? brDateTime(cols[7])
    const avgPrice = brNumber(cols[12])
    const qtyExec = brNumber(cols[13])
    const totalExec = brNumber(cols[16])
    if (!symbol || !time || avgPrice === null || qtyExec === null || qtyExec <= 0) continue

    const multiplier = totalExec !== null && avgPrice > 0 ? totalExec / (avgPrice * qtyExec) : 1

    fills.push({ symbol, side, time, price: avgPrice, qty: qtyExec, multiplier: multiplier || 1 })
  }

  fills.sort((a, b) => a.time.getTime() - b.time.getTime())

  interface Lot {
    side: TradeSide
    qty: number
    price: number
    time: Date
    multiplier: number
  }

  const openLots: Record<string, Lot[]> = {}
  const trades: Trade[] = []

  for (const f of fills) {
    const queue = (openLots[f.symbol] ??= [])
    let remaining = f.qty

    while (remaining > 0 && queue.length > 0 && queue[0].side !== f.side) {
      const lot = queue[0]
      const matchQty = Math.min(lot.qty, remaining)

      // `lot` entrou na fila antes desta fill ser processada (fills percorridas
      // em ordem cronológica), logo lot.time <= f.time sempre: lot é a entrada.
      trades.push({
        id: uuid(),
        createdAt: new Date().toISOString(),
        date: toDateStr(lot.time),
        entryTime: toTimeStr(lot.time),
        exitTime: toTimeStr(f.time),
        symbol: f.symbol,
        side: lot.side,
        quantity: matchQty,
        entryPrice: lot.price,
        exitPrice: f.price,
        multiplier: lot.multiplier,
        fees: 0,
        strategy: 'Day Trade (importado)',
        tags: ['extrato-corretora'],
      })

      lot.qty -= matchQty
      remaining -= matchQty
      if (lot.qty === 0) queue.shift()
    }

    if (remaining > 0) {
      queue.push({ side: f.side, qty: remaining, price: f.price, time: f.time, multiplier: f.multiplier })
    }
  }

  const openContracts: Record<string, number> = {}
  for (const [symbol, lots] of Object.entries(openLots)) {
    const qty = lots.reduce((s, l) => s + l.qty, 0)
    if (qty > 0) openContracts[symbol] = qty
  }

  return { trades, fillsFound: fills.length, ordersCancelled: cancelled, openContracts }
}

export function readFileWithFallbackEncoding(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const text = String(reader.result)
      // Se vier com caracteres de substituição (indicando encoding errado ao
      // ler um arquivo Windows-1252/ISO-8859-1 como UTF-8), tenta de novo.
      if (text.includes('�')) {
        const reader2 = new FileReader()
        reader2.onerror = () => reject(reader2.error)
        reader2.onload = () => resolve(String(reader2.result))
        reader2.readAsText(file, 'windows-1252')
      } else {
        resolve(text)
      }
    }
    reader.readAsText(file, 'utf-8')
  })
}
