import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Trade } from '../types'
import { fmtCurrency, netPnl, rMultiple } from '../lib/calc'
import { TradeForm } from './TradeForm'
import { csvToTrades, downloadCsv, tradesToCsv } from '../lib/csv'
import { isSantanderExtrato, parseSantanderExtrato, readFileWithFallbackEncoding } from '../lib/brokerImport'
import { estimateB3Fees } from '../lib/fees'
import { PageHeader } from './PageHeader'
import { IconLedger, IconUpload } from './icons'
import { useToast } from '../toastStore'

export function TradeLog() {
  const trades = useStore((s) => s.trades)
  const account = useStore((s) => s.account)
  const addTrade = useStore((s) => s.addTrade)
  const updateTrade = useStore((s) => s.updateTrade)
  const deleteTrade = useStore((s) => s.deleteTrade)
  const importTrades = useStore((s) => s.importTrades)
  const applyDailyFees = useStore((s) => s.applyDailyFees)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trade | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [strategyFilter, setStrategyFilter] = useState('')
  const [sideFilter, setSideFilter] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showFeeForm, setShowFeeForm] = useState(false)
  const [feeDate, setFeeDate] = useState('')
  const [feeTotal, setFeeTotal] = useState('')
  const toast = useToast((s) => s.show)

  const strategies = useMemo(
    () => Array.from(new Set(trades.map((t) => t.strategy).filter(Boolean))) as string[],
    [trades],
  )

  const filtered = useMemo(() => {
    return trades
      .filter((t) => (search ? t.symbol.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((t) => (strategyFilter ? t.strategy === strategyFilter : true))
      .filter((t) => (sideFilter ? t.side === sideFilter : true))
      .sort((a, b) => (b.date + (b.entryTime || '')).localeCompare(a.date + (a.entryTime || '')))
  }, [trades, search, strategyFilter, sideFilter])

  function handleSave(data: Omit<Trade, 'id' | 'createdAt'>) {
    if (editing) {
      updateTrade(editing.id, data)
      toast('Operação atualizada.')
    } else {
      addTrade(data)
      toast('Operação adicionada.')
    }
    setShowForm(false)
    setEditing(undefined)
  }

  async function processImportFile(file: File) {
    try {
      const text = await readFileWithFallbackEncoding(file)

      if (isSantanderExtrato(text)) {
        const result = parseSantanderExtrato(text)
        if (result.trades.length) importTrades(result.trades)

        const openParts = Object.entries(result.openContracts).map(([sym, qty]) => `${qty} ${sym}`)
        const parts = [
          `"${file.name}": ${result.trades.length} operações importadas`,
          `${result.fillsFound} execuções lidas`,
          `${result.ordersCancelled} ordens canceladas/rejeitadas ignoradas`,
        ]
        if (openParts.length) parts.push(`posição em aberto não fechada: ${openParts.join(', ')}`)
        setImportMsg(parts.join(' · '))
        if (result.trades.length) {
          const importDate = result.trades[0].date
          setFeeDate(importDate)
          setFeeTotal(String(estimateB3Fees(result.trades, importDate).total))
          setShowFeeForm(true)
        }
        return
      }

      const parsed = csvToTrades(text)
      if (parsed.length) {
        importTrades(parsed)
        setImportMsg(`"${file.name}": ${parsed.length} operações importadas.`)
      } else {
        setImportMsg(
          `Não consegui reconhecer "${file.name}". Ele precisa ser um extrato de ordens Santander/BMF ou um CSV exportado por esta plataforma.`,
        )
      }
    } catch (err) {
      setImportMsg(`Erro ao ler "${file.name}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) processImportFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processImportFile(file)
  }

  function handleApplyFees(e: React.FormEvent) {
    e.preventDefault()
    const total = Number(feeTotal)
    if (!feeDate || !Number.isFinite(total)) return
    applyDailyFees(feeDate, total)
    const count = trades.filter((t) => t.date === feeDate).length
    setImportMsg(`Taxas de ${fmtCurrency(total, account.currency)} rateadas entre ${count} operações de ${feeDate}.`)
    setShowFeeForm(false)
    setFeeTotal('')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Operações" description="Diário completo das suas entradas e saídas." />
        <div className="flex gap-2">
          <button
            onClick={() => downloadCsv(`trades-${Date.now()}.csv`, tradesToCsv(filtered))}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium border border-border bg-surface hover:bg-surface-2 text-ink-muted hover:text-ink"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => {
              setEditing(undefined)
              setShowForm(true)
            }}
            className="px-3.5 py-2 rounded-lg text-[13px] bg-accent hover:bg-accent-hover text-accent-fg font-semibold"
          >
            + Nova operação
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar ativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm w-40"
        />
        <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm">
          <option value="">Todas estratégias</option>
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm">
          <option value="">Compra/Venda</option>
          <option value="compra">Compra</option>
          <option value="venda">Venda</option>
        </select>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong bg-surface/60'
        }`}
      >
        <IconUpload className={`w-5 h-5 mb-1 ${dragOver ? 'text-accent' : 'text-ink-faint'}`} />
        <span className="text-sm text-ink-muted">
          Arraste aqui o extrato da corretora (Santander/BMF) ou um CSV exportado da plataforma
        </span>
        <span className="text-xs text-ink-faint">ou clique para escolher o arquivo</span>
        <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
      </label>

      {!showFeeForm && (
        <button
          onClick={() => {
            const date = trades[trades.length - 1]?.date ?? ''
            setFeeDate(date)
            setFeeTotal(date ? String(estimateB3Fees(trades, date).total) : '')
            setShowFeeForm(true)
          }}
          className="self-start text-xs text-ink-faint hover:text-ink-muted underline decoration-dotted underline-offset-4"
        >
          Ratear taxas de corretagem/B3 de um dia (não vêm no extrato de ordens)
        </button>
      )}

      {showFeeForm && (
        <form
          onSubmit={handleApplyFees}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-faint">
              Data
              <input
                type="date"
                value={feeDate}
                onChange={(e) => setFeeDate(e.target.value)}
                required
                className="rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-faint">
              Total de taxas do dia (R$)
              <input
                type="number"
                step="0.01"
                value={feeTotal}
                onChange={(e) => setFeeTotal(e.target.value)}
                placeholder="12.00"
                required
                className="rounded-lg px-2 py-1.5 text-sm w-32 font-mono"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const est = estimateB3Fees(trades, feeDate)
                setFeeTotal(String(est.total))
              }}
              className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface-2 hover:bg-border text-ink-muted mb-0.5"
            >
              Calcular automaticamente (B3)
            </button>
          </div>

          {feeDate &&
            (() => {
              const est = estimateB3Fees(trades, feeDate)
              if (est.items.length === 0) return null
              return (
                <div className="text-xs text-ink-faint leading-relaxed">
                  Estimativa: {est.items.map((i) => `${i.contracts}× ${i.symbol}`).join(', ')} →{' '}
                  <span className="font-mono tabular-nums text-ink-muted">{fmtCurrency(est.total, account.currency)}</span>
                  {est.hasUnknownSymbol && ' (algum ativo sem taxa cadastrada, considerado R$0)'}. Baseado em
                  emolumentos B3 aproximados por contrato (corretagem já é R$0 na maioria das corretoras para
                  minicontratos) — confira sua nota de corretagem para o valor exato, pois varia por faixa de
                  volume.
                </div>
              )
            })()}

          <span className="text-xs text-ink-faint max-w-md">
            O total é dividido proporcionalmente entre as operações do dia (por quantidade), substituindo a taxa
            atual de cada uma.
          </span>
          <div className="flex gap-2">
            <button type="submit" className="px-3.5 py-1.5 rounded-lg text-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold">
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setShowFeeForm(false)}
              className="px-3.5 py-1.5 rounded-lg text-sm text-ink-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {importMsg && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-ink">
          <span>{importMsg}</span>
          <button onClick={() => setImportMsg(null)} className="text-accent hover:text-accent-hover text-xs ml-4 shrink-0">
            fechar
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-ink-faint border-b border-border">
              <th className="px-3 py-2.5 font-medium">Data</th>
              <th className="px-3 py-2.5 font-medium">Ativo</th>
              <th className="px-3 py-2.5 font-medium">Lado</th>
              <th className="px-3 py-2.5 font-medium text-right">Qtd</th>
              <th className="px-3 py-2.5 font-medium text-right">Entrada</th>
              <th className="px-3 py-2.5 font-medium text-right">Saída</th>
              <th className="px-3 py-2.5 font-medium text-right">R</th>
              <th className="px-3 py-2.5 font-medium text-right">P&L</th>
              <th className="px-3 py-2.5 font-medium">Estratégia</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const pnl = netPnl(t)
              const r = rMultiple(t)
              return (
                <tr key={t.id} className="border-b border-border/60 hover:bg-surface-2/50 transition-colors">
                  <td className="px-3 py-2.5 text-ink-faint font-mono tabular-nums text-[13px]">{t.date}</td>
                  <td className="px-3 py-2.5 font-medium text-ink">{t.symbol}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        t.side === 'compra' ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'
                      }`}
                    >
                      {t.side === 'compra' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{t.quantity}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-muted">{t.entryPrice.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-muted">{t.exitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-faint">{r !== null ? `${r.toFixed(2)}R` : '–'}</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums font-semibold ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {fmtCurrency(pnl, account.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-ink-faint">{t.strategy || '–'}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditing(t)
                        setShowForm(true)
                      }}
                      className="text-ink-faint hover:text-ink mr-3 text-[13px]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir esta operação?')) {
                          deleteTrade(t.id)
                          toast('Operação excluída.', 'error')
                        }
                      }}
                      className="text-negative/80 hover:text-negative text-[13px]"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-14">
                  <div className="flex flex-col items-center gap-2 text-ink-faint">
                    <IconLedger className="w-6 h-6 opacity-50" />
                    <span className="text-sm">Nenhuma operação encontrada.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TradeForm
          initial={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditing(undefined)
          }}
        />
      )}
    </div>
  )
}
