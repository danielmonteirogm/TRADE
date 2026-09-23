import type { Trade } from '../types'
import { v4 as uuid } from 'uuid'

const HEADERS = [
  'date',
  'entryTime',
  'exitTime',
  'symbol',
  'side',
  'quantity',
  'entryPrice',
  'exitPrice',
  'stopLoss',
  'multiplier',
  'fees',
  'strategy',
  'setup',
  'emotion',
  'notes',
  'tags',
] as const

export function tradesToCsv(trades: Trade[]): string {
  const rows = trades.map((t) =>
    HEADERS.map((h) => {
      const v = h === 'tags' ? t.tags.join('|') : (t as unknown as Record<string, unknown>)[h]
      const s = v === undefined || v === null ? '' : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }).join(','),
  )
  return [HEADERS.join(','), ...rows].join('\n')
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') {
        result.push(cur)
        cur = ''
      } else cur += c
    }
  }
  result.push(cur)
  return result
}

export function csvToTrades(text: string): Trade[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const trades: Trade[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''))
    if (!row.date || !row.symbol) continue
    trades.push({
      id: uuid(),
      createdAt: new Date().toISOString(),
      date: row.date,
      entryTime: row.entryTime || undefined,
      exitTime: row.exitTime || undefined,
      symbol: row.symbol.toUpperCase(),
      side: row.side === 'venda' ? 'venda' : 'compra',
      quantity: Number(row.quantity) || 0,
      entryPrice: Number(row.entryPrice) || 0,
      exitPrice: Number(row.exitPrice) || 0,
      stopLoss: row.stopLoss ? Number(row.stopLoss) : undefined,
      multiplier: row.multiplier ? Number(row.multiplier) : undefined,
      fees: Number(row.fees) || 0,
      strategy: row.strategy || undefined,
      setup: row.setup || undefined,
      emotion: row.emotion || undefined,
      notes: row.notes || undefined,
      tags: row.tags ? row.tags.split('|').filter(Boolean) : [],
    })
  }
  return trades
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
