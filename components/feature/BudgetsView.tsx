'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import { useApp, useCategoriesByKind } from '@/lib/store'
import { currentPeriod, periodOf, periodsEqual } from '@/lib/format'
import { GoalSchema } from '@/lib/schemas'
import { toast } from 'sonner'
import { Modal, ConfirmDialog } from './Modal'
import type { Goal } from '@/lib/types'

export function BudgetsView() {
  const { state, actions } = useApp()
  const expenseCategories = useCategoriesByKind('expense')
  const { currency, locale } = state.settings

  const period = currentPeriod()
  const usedByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of state.transactions) {
      if (t.kind !== 'expense') continue
      if (!periodsEqual(periodOf(t.date), period)) continue
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
    }
    return map
  }, [state.transactions, period])

  const budgetMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of state.budgets) m.set(b.categoryId, b.monthlyLimit)
    return m
  }, [state.budgets])

  const fmt = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)
    } catch {
      return `${v.toFixed(2)} ${currency}`
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Orçamentos por categoria</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defina um limite mensal por categoria de despesa.
            </p>
          </div>
        </header>

        <div className="space-y-2 rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {expenseCategories.map((c) => {
            const used = usedByCategory.get(c.id) ?? 0
            const limit = budgetMap.get(c.id) ?? 0
            const pct = limit > 0 ? Math.min((used / limit) * 100, 999) : 0
            return (
              <div key={c.id} className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ background: c.color + '22' }}
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {fmt(used)} / {limit > 0 ? fmt(limit) : '—'}
                      </p>
                    </div>
                    {limit > 0 && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all duration-500 ${
                            pct >= 100
                              ? 'bg-red-500'
                              : pct >= 80
                                ? 'bg-amber-500'
                                : 'bg-foreground'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0"
                    value={limit || ''}
                    placeholder="—"
                    aria-label={`Limite mensal para ${c.name}`}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (isFinite(v) && v >= 0) {
                        actions.setBudget({ categoryId: c.id, monthlyLimit: v })
                      } else if (e.target.value === '') {
                        actions.setBudget({ categoryId: c.id, monthlyLimit: 0 })
                      }
                    }}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground tabular-nums text-right"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <GoalsSection fmt={fmt} />
    </div>
  )
}

function GoalsSection({ fmt }: { fmt: (n: number) => string }) {
  const { state, actions } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Goal | null>(null)

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Target size={16} /> Metas de poupança
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Objetivos com valor-alvo e progresso editável.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Nova meta
        </button>
      </header>

      {state.goals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <div className="text-2xl">🎯</div>
          <p>Ainda sem metas. Crie a primeira para acompanhar progresso.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {state.goals.map((g) => {
            const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0
            return (
              <li
                key={g.id}
                className="rounded-xl border border-border bg-card p-4 group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex size-9 items-center justify-center rounded-full text-base shrink-0"
                      style={{ background: g.color + '22' }}
                    >
                      {g.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      {g.deadline && (
                        <p className="text-[11px] text-muted-foreground">
                          Até {g.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(g)
                        setShowForm(true)
                      }}
                      aria-label="Editar"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(g)}
                      aria-label="Remover"
                      className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(g.saved)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    de {fmt(g.target)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: g.color,
                    }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const amt = window.prompt('Valor a adicionar:')
                      const v = parseFloat(amt ?? '')
                      if (isFinite(v) && v > 0) {
                        actions.updateGoal({ ...g, saved: g.saved + v })
                        toast.success('Progresso atualizado')
                      }
                    }}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors"
                  >
                    + Depositar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const amt = window.prompt('Valor a remover:')
                      const v = parseFloat(amt ?? '')
                      if (isFinite(v) && v > 0) {
                        actions.updateGoal({
                          ...g,
                          saved: Math.max(0, g.saved - v),
                        })
                        toast.success('Progresso atualizado')
                      }
                    }}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors"
                  >
                    − Levantar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <GoalForm
        open={showForm}
        onClose={() => setShowForm(false)}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover meta"
        message={confirmRemove ? `Remover «${confirmRemove.name}»?` : ''}
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemove) actions.removeGoal(confirmRemove.id)
        }}
        onClose={() => setConfirmRemove(null)}
      />
    </section>
  )
}

function GoalForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Goal | null
}) {
  const { actions } = useApp()
  const [form, setForm] = useState({
    name: '',
    target: '',
    saved: '0',
    deadline: '',
    icon: '🎯',
    color: '#10b981',
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        target: String(editing.target),
        saved: String(editing.saved),
        deadline: editing.deadline ?? '',
        icon: editing.icon,
        color: editing.color,
      })
    } else {
      setForm({
        name: '',
        target: '',
        saved: '0',
        deadline: '',
        icon: '🎯',
        color: '#10b981',
      })
    }
  }, [open, editing])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      id: editing?.id ?? 'placeholder',
      name: form.name,
      target: form.target,
      saved: form.saved,
      deadline: form.deadline || undefined,
      icon: form.icon || '🎯',
      color: form.color,
    }
    const result = GoalSchema.safeParse(payload)
    if (!result.success) {
      toast.error('Verifique os campos')
      return
    }
    if (editing) {
      actions.updateGoal(result.data)
      toast.success('Meta atualizada')
    } else {
      const { id: _id, ...rest } = result.data
      actions.addGoal(rest)
    }
    setForm({ name: '', target: '', saved: '0', deadline: '', icon: '🎯', color: '#10b981' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar meta' : 'Nova meta'}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium block mb-1.5">Nome</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex.: Férias, Computador novo, ..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Valor-alvo</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Já poupado</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.saved}
              onChange={(e) => setForm((f) => ({ ...f, saved: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground tabular-nums"
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Prazo</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Ícone</span>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              maxLength={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Cor</span>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-[38px] w-full rounded-lg border border-border bg-background px-1 py-1 outline-none focus:border-foreground cursor-pointer"
            />
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            {editing ? 'Guardar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
