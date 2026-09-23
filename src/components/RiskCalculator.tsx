import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { fmtCurrency } from '../lib/calc'
import { PageHeader } from './PageHeader'

export function RiskCalculator() {
  const account = useStore((s) => s.account)
  const trades = useStore((s) => s.trades)
  const netTotal = useMemo(
    () => trades.reduce((s, t) => s + ((t.side === 'compra' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice) * t.quantity - t.fees), 0),
    [trades],
  )
  const currentBalance = account.initialBalance + netTotal

  const [balance, setBalance] = useState(currentBalance)
  const [riskPct, setRiskPct] = useState(1)
  const [entry, setEntry] = useState(0)
  const [stop, setStop] = useState(0)
  const [rr, setRr] = useState(2)

  const riskAmount = (balance * riskPct) / 100
  const riskPerShare = Math.abs(entry - stop)
  const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0
  const positionValue = positionSize * entry
  const target = entry > stop ? entry + riskPerShare * rr : entry - riskPerShare * rr

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Calculadora de risco" description="Dimensione a posição antes de entrar, não depois." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
          <h3 className="font-medium text-sm text-ink-muted">Parâmetros</h3>

          <LabeledInput label="Saldo da conta" value={balance} onChange={setBalance} step={100} />
          <LabeledInput label="Risco por operação (%)" value={riskPct} onChange={setRiskPct} step={0.1} />
          <LabeledInput label="Preço de entrada" value={entry} onChange={setEntry} step={0.01} />
          <LabeledInput label="Preço de stop loss" value={stop} onChange={setStop} step={0.01} />
          <LabeledInput label="Relação risco:retorno alvo (R)" value={rr} onChange={setRr} step={0.5} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3">
          <h3 className="font-medium text-sm text-ink-muted mb-1">Resultado</h3>
          <Result label="Risco em dinheiro" value={fmtCurrency(riskAmount, account.currency)} />
          <Result label="Risco por ação/contrato" value={riskPerShare ? fmtCurrency(riskPerShare, account.currency) : '–'} />
          <Result label="Tamanho de posição sugerido" value={positionSize > 0 ? `${positionSize} unidades` : '–'} highlight />
          <Result label="Valor total da posição" value={positionValue ? fmtCurrency(positionValue, account.currency) : '–'} />
          <Result label="Alvo (take profit) sugerido" value={target && riskPerShare ? fmtCurrency(target, account.currency) : '–'} />
          {positionValue > balance && (
            <p className="text-accent text-xs mt-2 flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />
              O valor da posição excede o saldo disponível. Considere reduzir o tamanho ou usar margem com cautela.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-faint">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg px-3 py-2 text-sm font-mono"
      />
    </label>
  )
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`font-mono tabular-nums font-semibold ${highlight ? 'text-accent text-lg' : 'text-ink'}`}>{value}</span>
    </div>
  )
}
