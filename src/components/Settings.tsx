import { useState } from 'react'
import { useStore } from '../store'
import { downloadCsv, tradesToCsv } from '../lib/csv'
import { PageHeader } from './PageHeader'
import { useToast } from '../toastStore'

export function Settings() {
  const account = useStore((s) => s.account)
  const setAccount = useStore((s) => s.setAccount)
  const trades = useStore((s) => s.trades)
  const [form, setForm] = useState(account)
  const toast = useToast((s) => s.show)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setAccount(form)
    toast('Configurações salvas.')
  }

  function clearAll() {
    if (confirm('Isso vai apagar TODOS os dados salvos localmente (operações, metas, regras). Continuar?')) {
      localStorage.removeItem('trader-journal-storage')
      window.location.reload()
    }
  }

  function exportBackup() {
    downloadCsv(`backup-trades-${Date.now()}.csv`, tradesToCsv(trades))
    toast('Backup exportado.')
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <PageHeader title="Configurações" />

      <form onSubmit={submit} className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3">
        <h3 className="font-medium text-sm text-ink-muted mb-1">Conta</h3>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Nome da conta
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Saldo inicial
          <input
            type="number"
            value={form.initialBalance}
            onChange={(e) => setForm((f) => ({ ...f, initialBalance: Number(e.target.value) }))}
            className="rounded-lg px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Moeda
          <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="rounded-lg px-3 py-2 text-sm">
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </label>
        <button type="submit" className="mt-2 px-4 py-2 rounded-lg text-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold self-start">
          Salvar
        </button>
      </form>

      <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3">
        <h3 className="font-medium text-sm text-ink-muted mb-1">Dados</h3>
        <p className="text-xs text-ink-faint leading-relaxed">
          Todos os dados ficam salvos localmente no seu navegador (localStorage). Faça backup regularmente exportando para CSV.
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportBackup}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface-2 hover:bg-border text-ink-muted"
          >
            Exportar backup ({trades.length} operações)
          </button>
          <button onClick={clearAll} className="px-3 py-2 rounded-lg text-sm bg-negative-soft hover:bg-negative/20 text-negative">
            Apagar todos os dados
          </button>
        </div>
      </div>
    </div>
  )
}
