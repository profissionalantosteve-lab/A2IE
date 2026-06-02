'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/lib/store'
import { CategorySchema } from '@/lib/schemas'
import { Modal, ConfirmDialog } from './Modal'
import type { Category, TransactionKind } from '@/lib/types'

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
  '#22c55e', '#84cc16', '#eab308', '#f97316',
  '#ef4444', '#ec4899', '#a855f7', '#737373',
]

export function CategoriesView() {
  const { state, actions } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Category | null>(null)

  const inUseIds = new Set(state.transactions.map((t) => t.categoryId))

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">Categorias</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize as categorias de receitas e despesas.
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
          <Plus size={12} /> Nova
        </button>
      </header>

      {(['expense', 'income'] as const).map((kind) => {
        const list = state.categories.filter((c) => c.kind === kind)
        return (
          <section key={kind}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {kind === 'expense' ? 'Despesas' : 'Receitas'} ({list.length})
            </h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((c) => {
                const used = inUseIds.has(c.id)
                return (
                  <li
                    key={c.id}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-base"
                      style={{ background: c.color + '22' }}
                    >
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {used ? 'em uso' : 'não usada'}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(c)
                          setShowForm(true)
                        }}
                        aria-label="Editar"
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={used}
                        onClick={() => setConfirmRemove(c)}
                        aria-label={used ? 'Categoria em uso' : 'Remover'}
                        title={
                          used
                            ? 'Esta categoria tem transações associadas e não pode ser removida.'
                            : 'Remover'
                        }
                        className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <CategoryForm
        open={showForm}
        onClose={() => setShowForm(false)}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover categoria"
        message={confirmRemove ? `Remover «${confirmRemove.name}»?` : ''}
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemove) actions.removeCategory(confirmRemove.id)
        }}
        onClose={() => setConfirmRemove(null)}
      />
    </div>
  )
}

function CategoryForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Category | null
}) {
  const { actions } = useApp()
  const [form, setForm] = useState({
    name: '',
    icon: '📌',
    color: PRESET_COLORS[0],
    kind: 'expense' as TransactionKind,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        icon: editing.icon,
        color: editing.color,
        kind: editing.kind,
      })
    } else {
      setForm({ name: '', icon: '📌', color: PRESET_COLORS[0], kind: 'expense' })
    }
  }, [open, editing])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      id: editing?.id ?? 'placeholder',
      name: form.name,
      icon: form.icon || '📌',
      color: form.color,
      kind: form.kind,
    }
    const result = CategorySchema.safeParse(payload)
    if (!result.success) {
      toast.error('Verifique os campos')
      return
    }
    if (editing) {
      actions.updateCategory(result.data)
      toast.success('Categoria atualizada')
    } else {
      const { id: _id, ...rest } = result.data
      actions.addCategory(rest)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar categoria' : 'Nova categoria'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Nome</span>
            <input
              type="text"
              required
              maxLength={40}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Tipo</span>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({ ...f, kind: e.target.value as TransactionKind }))
              }
              disabled={!!editing}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground disabled:opacity-60"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium block mb-1.5">Ícone (emoji)</span>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            maxLength={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <fieldset>
          <legend className="text-xs font-medium block mb-1.5">Cor</legend>
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                aria-label={`Cor ${c}`}
                aria-pressed={form.color === c}
                className={`h-8 rounded-md transition-all ${
                  form.color === c
                    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                    : 'hover:scale-105'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>
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
