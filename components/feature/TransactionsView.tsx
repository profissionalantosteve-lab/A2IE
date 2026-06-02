'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, X } from 'lucide-react'
import { useApp, useAccountMap, useCategoryMap } from '@/lib/store'
import { formatDateShort, parseISODate } from '@/lib/format'
import type { Transaction } from '@/lib/types'
import { TransactionForm } from './TransactionForm'
import { ConfirmDialog } from './Modal'

type SortKey = 'date' | 'amount' | 'description'
type SortDir = 'asc' | 'desc'

export function TransactionsView() {
  const { state, actions } = useApp()
  const catMap = useCategoryMap()
  const accMap = useAccountMap()
  const { currency, locale } = state.settings

  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState<'all' | 'expense' | 'income'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<Transaction | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.transactions
      .filter((t) => {
        if (filterKind !== 'all' && t.kind !== filterKind) return false
        if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false
        if (filterAccount !== 'all' && t.accountId !== filterAccount) return false
        if (q) {
          const cat = catMap.get(t.categoryId)?.name.toLowerCase() ?? ''
          const acc = accMap.get(t.accountId)?.name.toLowerCase() ?? ''
          const hay =
            t.description.toLowerCase() +
            ' ' +
            cat +
            ' ' +
            acc +
            ' ' +
            t.tags.join(' ').toLowerCase() +
            ' ' +
            (t.notes ?? '').toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'date') {
          cmp = parseISODate(a.date).getTime() - parseISODate(b.date).getTime()
        } else if (sortKey === 'amount') {
          cmp = a.amount - b.amount
        } else {
          cmp = a.description.localeCompare(b.description, locale)
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [
    state.transactions,
    search,
    filterKind,
    filterCategory,
    filterAccount,
    sortKey,
    sortDir,
    catMap,
    accMap,
    locale,
  ])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of filtered) {
      if (t.kind === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const fmt = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)
    } catch {
      return `${v.toFixed(2)} ${currency}`
    }
  }

  const activeFilters = [
    filterKind !== 'all',
    filterCategory !== 'all',
    filterAccount !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por descrição, categoria, tag, notas..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-foreground"
              aria-label="Pesquisar transações"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpar pesquisa"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                activeFilters > 0 || showFilters
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters > 0 && (
                <span className="rounded-full bg-foreground text-background px-1.5 text-[10px] font-bold tabular-nums">
                  {activeFilters}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setShowForm(true)
              }}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3">
            <FilterSelect
              label="Tipo"
              value={filterKind}
              onChange={(v) => setFilterKind(v as typeof filterKind)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'expense', label: 'Despesa' },
                { value: 'income', label: 'Receita' },
              ]}
            />
            <FilterSelect
              label="Categoria"
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: 'all', label: 'Todas' },
                ...state.categories.map((c) => ({
                  value: c.id,
                  label: `${c.icon} ${c.name}`,
                })),
              ]}
            />
            <FilterSelect
              label="Conta"
              value={filterAccount}
              onChange={setFilterAccount}
              options={[
                { value: 'all', label: 'Todas' },
                ...state.accounts.map((a) => ({
                  value: a.id,
                  label: `${a.icon} ${a.name}`,
                })),
              ]}
            />
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Ordenar
              </label>
              <div className="flex gap-1">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground"
                >
                  <option value="date">Data</option>
                  <option value="amount">Valor</option>
                  <option value="description">Descrição</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  aria-label={sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
                  className="rounded-md border border-border bg-background px-2 hover:bg-muted text-sm"
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
        <span>
          {filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}
        </span>
        <span className="tabular-nums">
          <span className="text-emerald-600 dark:text-emerald-400">
            +{fmt(totals.income)}
          </span>
          {'  ·  '}
          <span className="text-red-600 dark:text-red-400">
            −{fmt(totals.expense)}
          </span>
          {'  ·  '}
          <span className={totals.net < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'font-medium'}>
            {fmt(totals.net)}
          </span>
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          hasAny={state.transactions.length > 0}
          onAdd={() => {
            setEditing(null)
            setShowForm(true)
          }}
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {filtered.map((t) => {
            const cat = catMap.get(t.categoryId)
            const acc = accMap.get(t.accountId)
            return (
              <li
                key={t.id}
                className="group flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ background: (cat?.color ?? '#737373') + '22' }}
                >
                  {cat?.icon ?? '📦'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-medium">
                      {t.description}
                    </p>
                    {t.recurrence !== 'none' && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ↻
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {cat?.name ?? '—'} · {acc?.name ?? '—'} ·{' '}
                    {formatDateShort(t.date, locale)}
                    {t.tags.length > 0 && ' · ' + t.tags.map((x) => `#${x}`).join(' ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      t.kind === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {t.kind === 'income' ? '+' : '−'}
                    {fmt(t.amount)}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(t)
                        setShowForm(true)
                      }}
                      aria-label={`Editar ${t.description}`}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(t)}
                      aria-label={`Remover ${t.description}`}
                      className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <TransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover transação"
        message={
          confirmRemove
            ? `Remover «${confirmRemove.description}»? Esta ação não pode ser revertida.`
            : ''
        }
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemove) actions.removeTransaction(confirmRemove.id)
        }}
        onClose={() => setConfirmRemove(null)}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function EmptyState({
  hasAny,
  onAdd,
}: {
  hasAny: boolean
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
      <div className="text-3xl">{hasAny ? '🔍' : '👋'}</div>
      <div>
        <p className="text-sm font-medium">
          {hasAny ? 'Sem resultados para os filtros aplicados.' : 'Ainda sem transações.'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {hasAny
            ? 'Experimente outra pesquisa ou limpe os filtros.'
            : 'Comece por registar a sua primeira receita ou despesa.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
      >
        + Nova transação
      </button>
    </div>
  )
}
