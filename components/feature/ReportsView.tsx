'use client'

import { useMemo, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp, useAccountMap, useCategoryMap } from '@/lib/store'
import {
  currentPeriod,
  formatDate,
  periodLabel,
  periodOf,
  periodsEqual,
  shiftPeriod,
} from '@/lib/format'
import {
  exportCSV,
  exportJSON,
  exportXLSX,
  openPrintReport,
  readJSONFile,
} from '@/lib/export'
import type { Period } from '@/lib/types'

export function ReportsView() {
  const { state, actions } = useApp()
  const catMap = useCategoryMap()
  const accMap = useAccountMap()
  const [period, setPeriod] = useState<Period>(currentPeriod())
  const { currency, locale } = state.settings

  const txsInPeriod = useMemo(
    () =>
      state.transactions.filter((t) => periodsEqual(periodOf(t.date), period)),
    [state.transactions, period],
  )

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    const byCategory = new Map<string, number>()
    for (const t of txsInPeriod) {
      if (t.kind === 'income') income += t.amount
      else {
        expense += t.amount
        byCategory.set(
          t.categoryId,
          (byCategory.get(t.categoryId) ?? 0) + t.amount,
        )
      }
    }
    return { income, expense, net: income - expense, byCategory }
  }, [txsInPeriod])

  const fmt = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)
    } catch {
      return `${v.toFixed(2)} ${currency}`
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    readJSONFile(file)
      .then((raw) => {
        const ok = actions.importState(raw)
        if (ok) toast.success('Dados importados com sucesso')
      })
      .catch(() => toast.error('Não foi possível ler o ficheiro'))
      .finally(() => {
        e.target.value = ''
      })
  }

  const periodTitle = periodLabel(period, locale)

  return (
    <div className="space-y-6">
      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Relatório mensal</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPeriod(shiftPeriod(period, -1))}
              aria-label="Mês anterior"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium tabular-nums px-2">
              {periodTitle}
            </span>
            <button
              type="button"
              onClick={() => setPeriod(shiftPeriod(period, 1))}
              aria-label="Mês seguinte"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <SummaryCard label="Receitas" value={fmt(summary.income)} accent="text-emerald-600 dark:text-emerald-400" />
          <SummaryCard label="Despesas" value={fmt(summary.expense)} accent="text-red-600 dark:text-red-400" />
          <SummaryCard label="Saldo" value={fmt(summary.net)} accent={summary.net < 0 ? 'text-red-600 dark:text-red-400' : ''} />
        </div>

        {summary.byCategory.size > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from(summary.byCategory.entries())
                  .sort(([, a], [, b]) => b - a)
                  .map(([id, value]) => {
                    const cat = catMap.get(id)
                    const pct = summary.expense > 0 ? (value / summary.expense) * 100 : 0
                    return (
                      <tr key={id}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span>{cat?.icon ?? '—'}</span>
                            <span>{cat?.name ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmt(value)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{pct.toFixed(0)}%</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sem despesas no período.
          </div>
        )}
      </section>

      {/* Recent transactions */}
      {txsInPeriod.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">
            Transações do mês ({txsInPeriod.length})
          </h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Descrição</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...txsInPeriod]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 50)
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(t.date, locale)}
                      </td>
                      <td className="px-4 py-2 truncate max-w-xs">{t.description}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {catMap.get(t.categoryId)?.icon} {catMap.get(t.categoryId)?.name ?? '—'}
                      </td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums whitespace-nowrap ${
                          t.kind === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : ''
                        }`}
                      >
                        {t.kind === 'income' ? '+' : '−'}
                        {fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {txsInPeriod.length > 50 && (
              <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                +{txsInPeriod.length - 50} mais — use o ecrã de Transações para ver todas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Export & Import */}
      <section>
        <h2 className="text-base font-semibold mb-3">Exportar / Importar</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <ExportCard
            icon={<Printer size={16} />}
            title="Relatório PDF"
            description="Abre uma vista de impressão do mês atual."
            onClick={() =>
              openPrintReport({
                title: `Relatório · ${periodTitle}`,
                subtitle: 'Gerado por A2IE — Expense Analyzer',
                currency,
                locale,
                txs: txsInPeriod,
                categories: catMap,
                accounts: accMap,
                summary,
              })
            }
          />
          <ExportCard
            icon={<FileSpreadsheet size={16} />}
            title="Excel (.xls)"
            description="Folha de cálculo aberta no Excel/Numbers/LibreOffice."
            onClick={() =>
              exportXLSX(
                txsInPeriod,
                catMap,
                accMap,
                `transacoes-${period.year}-${String(period.month + 1).padStart(2, '0')}.xls`,
              )
            }
          />
          <ExportCard
            icon={<FileText size={16} />}
            title="CSV"
            description="Texto separado por vírgulas (UTF-8, com BOM)."
            onClick={() =>
              exportCSV(
                txsInPeriod,
                catMap,
                accMap,
                `transacoes-${period.year}-${String(period.month + 1).padStart(2, '0')}.csv`,
              )
            }
          />
          <ExportCard
            icon={<Download size={16} />}
            title="Backup JSON"
            description="Cópia completa de tudo (transações, categorias, contas, metas)."
            onClick={() => exportJSON(state, 'a2ie-backup.json')}
          />
        </div>

        <label className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 cursor-pointer hover:border-foreground transition-colors">
          <Upload size={18} className="text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Importar backup JSON</p>
            <p className="text-xs text-muted-foreground">
              Substitui todos os dados atuais pelos do ficheiro selecionado.
            </p>
          </div>
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="sr-only"
          />
          <span className="rounded-md border border-border px-2.5 py-1 text-xs">
            Escolher ficheiro
          </span>
        </label>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums ${accent ?? ''}`}>{value}</p>
    </div>
  )
}

function ExportCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-foreground transition-colors"
    >
      <div className="flex size-8 items-center justify-center rounded-md bg-muted shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  )
}
