import { useState } from 'react'
import type { Trade, TradeSide } from '../types'
import { DEFAULT_STRATEGIES, EMOTIONS } from '../types'
import { format } from 'date-fns'

interface Props {
  initial?: Trade
  onSave: (t: Omit<Trade, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const empty = {
  date: format(new Date(), 'yyyy-MM-dd'),
  entryTime: '',
  exitTime: '',
  symbol: '',
  side: 'compra' as TradeSide,
  quantity: 100,
  entryPrice: 0,
  exitPrice: 0,
  stopLoss: undefined as number | undefined,
  fees: 0,
  strategy: '',
  setup: '',
  emotion: '',
  notes: '',
  tags: [] as string[],
}

export function TradeForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState(initial ? { ...initial } : empty)
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(', ') ?? '')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.symbol || form.quantity <= 0) return
    onSave({
      ...form,
      symbol: form.symbol.toUpperCase(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50"
      >
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-ink">{initial ? 'Editar operação' : 'Nova operação'}</h2>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink text-lg leading-none px-1">
            ×
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            <Field label="Data">
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>
            <Field label="Hora entrada">
              <input type="time" value={form.entryTime} onChange={(e) => set('entryTime', e.target.value)} className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>
            <Field label="Hora saída">
              <input type="time" value={form.exitTime} onChange={(e) => set('exitTime', e.target.value)} className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>

            <Field label="Ativo">
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => set('symbol', e.target.value.toUpperCase())}
                placeholder="PETR4"
                required
                className="w-full rounded-lg px-2.5 py-2 text-sm uppercase"
              />
            </Field>
            <Field label="Lado">
              <select value={form.side} onChange={(e) => set('side', e.target.value as TradeSide)} className="w-full rounded-lg px-2.5 py-2 text-sm">
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
              </select>
            </Field>
            <Field label="Quantidade">
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => set('quantity', Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-lg px-2.5 py-2 text-sm font-mono"
              />
            </Field>

            <Field label="Preço entrada">
              <input
                type="number"
                step="0.01"
                value={form.entryPrice}
                onChange={(e) => set('entryPrice', Number(e.target.value))}
                required
                className="w-full rounded-lg px-2.5 py-2 text-sm font-mono"
              />
            </Field>
            <Field label="Preço saída">
              <input
                type="number"
                step="0.01"
                value={form.exitPrice}
                onChange={(e) => set('exitPrice', Number(e.target.value))}
                required
                className="w-full rounded-lg px-2.5 py-2 text-sm font-mono"
              />
            </Field>
            <Field label="Stop loss (opcional)">
              <input
                type="number"
                step="0.01"
                value={form.stopLoss ?? ''}
                onChange={(e) => set('stopLoss', e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full rounded-lg px-2.5 py-2 text-sm font-mono"
              />
            </Field>

            <Field label="Taxas/corretagem">
              <input
                type="number"
                step="0.01"
                value={form.fees}
                onChange={(e) => set('fees', Number(e.target.value))}
                className="w-full rounded-lg px-2.5 py-2 text-sm font-mono"
              />
            </Field>
            <Field label="Estratégia">
              <input
                type="text"
                list="strategies"
                value={form.strategy}
                onChange={(e) => set('strategy', e.target.value)}
                className="w-full rounded-lg px-2.5 py-2 text-sm"
              />
              <datalist id="strategies">
                {DEFAULT_STRATEGIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Emoção">
              <select value={form.emotion} onChange={(e) => set('emotion', e.target.value)} className="w-full rounded-lg px-2.5 py-2 text-sm">
                <option value="">–</option>
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Setup" className="col-span-2 md:col-span-3">
              <input type="text" value={form.setup} onChange={(e) => set('setup', e.target.value)} className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>
            <Field label="Tags (separadas por vírgula)" className="col-span-2 md:col-span-3">
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>
            <Field label="Notas" className="col-span-2 md:col-span-3">
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className="w-full rounded-lg px-2.5 py-2 text-sm" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface-2">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold">
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-faint ${className ?? ''}`}>
      {label}
      {children}
    </label>
  )
}
