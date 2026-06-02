'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TransactionSchema } from '@/lib/schemas'
import { today } from '@/lib/format'
import { useApp, useCategoriesByKind } from '@/lib/store'
import type { Transaction, TransactionKind } from '@/lib/types'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
}

interface FormState {
  kind: TransactionKind
  description: string
  amount: string
  date: string
  categoryId: string
  accountId: string
  tags: string
  notes: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
}

const EMPTY: FormState = {
  kind: 'expense',
  description: '',
  amount: '',
  date: today(),
  categoryId: '',
  accountId: '',
  tags: '',
  notes: '',
  recurrence: 'none',
}

export function TransactionForm({ open, onClose, editing }: Props) {
  const { state, actions } = useApp()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  const expenseCategories = useCategoriesByKind('expense')
  const incomeCategories = useCategoriesByKind('income')
  const categories = form.kind === 'expense' ? expenseCategories : incomeCategories

  // Reset / preload when opening.
  useEffect(() => {
    if (!open) return
    setErrors({})
    if (editing) {
      setForm({
        kind: editing.kind,
        description: editing.description,
        amount: String(editing.amount),
        date: editing.date,
        categoryId: editing.categoryId,
        accountId: editing.accountId,
        tags: editing.tags.join(', '),
        notes: editing.notes ?? '',
        recurrence: editing.recurrence,
      })
    } else {
      setForm({
        ...EMPTY,
        date: today(),
        categoryId:
          expenseCategories[0]?.id ?? state.categories[0]?.id ?? '',
        accountId: state.accounts[0]?.id ?? '',
      })
    }
  }, [open, editing, state.categories, state.accounts, expenseCategories])

  // When the user switches kind, snap the category to one of the right type.
  useEffect(() => {
    if (!open) return
    if (!categories.find((c) => c.id === form.categoryId)) {
      setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? '' }))
    }
  }, [open, form.kind, categories, form.categoryId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const tagsList = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 20)

    const payload = {
      id: editing?.id ?? 'placeholder',
      kind: form.kind,
      description: form.description,
      amount: form.amount,
      date: form.date,
      categoryId: form.categoryId,
      accountId: form.accountId,
      tags: tagsList,
      notes: form.notes,
      recurrence: form.recurrence,
      createdAt: editing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }

    const result = TransactionSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(flat)) {
        if (v && v[0]) out[k] = v[0]
      }
      setErrors(out)
      toast.error('Verifique os campos em destaque')
      return
    }

    if (editing) {
      actions.updateTransaction(result.data)
    } else {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = result.data
      actions.addTransaction(rest)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar transação' : 'Nova transação'}
      initialFocus={firstInputRef as React.RefObject<HTMLElement>}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kind toggle */}
        <div
          role="radiogroup"
          aria-label="Tipo"
          className="grid grid-cols-2 rounded-lg border border-border bg-muted p-0.5"
        >
          <KindBtn
            active={form.kind === 'expense'}
            onClick={() => setForm((f) => ({ ...f, kind: 'expense' }))}
            label="Despesa"
            accent="data-[active=true]:bg-red-500 data-[active=true]:text-white"
          />
          <KindBtn
            active={form.kind === 'income'}
            onClick={() => setForm((f) => ({ ...f, kind: 'income' }))}
            label="Receita"
            accent="data-[active=true]:bg-emerald-500 data-[active=true]:text-white"
          />
        </div>

        {/* Description */}
        <Field label="Descrição" error={errors.description}>
          <input
            ref={firstInputRef}
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ex.: Almoço, Salário, ..."
            maxLength={200}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </Field>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor" error={errors.amount}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0,00"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground tabular-nums"
            />
          </Field>
          <Field label="Data" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
        </div>

        {/* Category + Account */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria" error={errors.categoryId}>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              {categories.length === 0 && <option value="">—</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Conta" error={errors.accountId}>
            <select
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              {state.accounts.length === 0 && <option value="">—</option>}
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Tags */}
        <Field
          label="Tags"
          hint="Separe com vírgulas (opcional)"
          error={errors.tags}
        >
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="viagem, urgente, ..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </Field>

        {/* Recurrence + Notes */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recorrência">
            <select
              value={form.recurrence}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  recurrence: e.target.value as FormState['recurrence'],
                }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="none">Nenhuma</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </Field>
          <Field label="Notas">
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Opcional"
              maxLength={2000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            {editing ? 'Guardar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function KindBtn({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean
  onClick: () => void
  label: string
  accent: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-active={active}
      onClick={onClick}
      className={`rounded-md py-1.5 text-sm font-medium transition-colors ${accent} text-muted-foreground`}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {hint && !error && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </label>
  )
}
