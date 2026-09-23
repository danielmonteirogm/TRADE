import { useState } from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'
import { PageHeader } from './PageHeader'
import { useToast } from '../toastStore'

export function Rules() {
  const rules = useStore((s) => s.rules)
  const ruleChecks = useStore((s) => s.ruleChecks)
  const addRule = useStore((s) => s.addRule)
  const removeRule = useStore((s) => s.removeRule)
  const toggleRuleCheck = useStore((s) => s.toggleRuleCheck)
  const [newRule, setNewRule] = useState('')
  const toast = useToast((s) => s.show)

  const today = format(new Date(), 'yyyy-MM-dd')
  const checkedCount = rules.filter((r) => ruleChecks[`${today}:${r.id}`]).length
  const pct = rules.length ? (checkedCount / rules.length) * 100 : 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!newRule.trim()) return
    addRule(newRule.trim())
    setNewRule('')
    toast('Regra adicionada.')
  }

  function handleRemove(id: string) {
    removeRule(id)
    toast('Regra removida.', 'error')
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <PageHeader title="Disciplina" description="Registrado antes de operar, não depois de justificar." />

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-medium text-sm text-ink-muted">Checklist de hoje</h3>
          <span className="text-xs text-ink-faint font-mono tabular-nums">
            {checkedCount}/{rules.length}
          </span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-col gap-1">
          {rules.map((r) => {
            const key = `${today}:${r.id}`
            const checked = !!ruleChecks[key]
            return (
              <label
                key={r.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-2 cursor-pointer group transition-colors"
              >
                <input type="checkbox" checked={checked} onChange={() => toggleRuleCheck(today, r.id)} className="w-4 h-4 accent-[#1f4fb8]" />
                <span className={`text-sm flex-1 ${checked ? 'text-ink-faint line-through' : 'text-ink'}`}>{r.text}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(r.id)}
                  className="text-negative/80 hover:text-negative opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                >
                  remover
                </button>
              </label>
            )
          })}
          {rules.length === 0 && <p className="text-sm text-ink-faint px-3">Nenhuma regra cadastrada.</p>}
        </div>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="Adicionar nova regra de disciplina..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-accent hover:bg-accent-hover text-accent-fg font-semibold">
          Adicionar
        </button>
      </form>
    </div>
  )
}
